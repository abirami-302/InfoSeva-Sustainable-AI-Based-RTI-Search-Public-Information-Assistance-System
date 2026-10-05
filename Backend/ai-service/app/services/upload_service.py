import uuid
from datetime import datetime
from typing import BinaryIO, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.utils.file_utils import validate_pdf, validate_file_size, save_temp_file, delete_temp_file
from app.utils.pdf_utils import extract_text_from_pdf
from app.services.document_service import create_document, delete_document
from app.services.embedding_service import embed_document, delete_document_embeddings
from app.config.logging_config import get_logger

logger = get_logger(__name__)


class UploadResult(BaseModel):
    success: bool
    documentId: str
    title: str
    department: str
    chunksProcessed: int
    message: str
    rollbackAttempted: bool = False
    rollbackSuccess: bool = False
    error: Optional[str] = None


async def upload_pdf(
    file_obj: BinaryIO,
    filename: str,
    file_size: int,
    title: str,
    department: str,
    document_type: str,
    document_date: str,
    source: str = "Upload",
    source_type: str = "UNCLASSIFIED"
) -> UploadResult:
    """
    Executes the transactional PDF upload workflow:
    Validation -> Save Temp -> Extract Text -> Create Mongo Document -> Generate Embeddings -> Cleanup & Return.
    Executes compensating rollback if embedding generation fails.
    """
    document_id = f"doc_{uuid.uuid4().hex[:12]}"
    temp_file_path: Optional[str] = None
    mongo_created = False
    embedding_created = False

    try:
        # Step 1: Validate input file
        logger.info(f"Initiating PDF upload for '{filename}' (Document ID: '{document_id}', Source Type: '{source_type}')...")
        validate_pdf(filename)
        validate_file_size(file_size)

        # Step 2: Save to temporary file
        temp_file_path = save_temp_file(file_obj, filename)

        # Step 3: Extract PDF text
        logger.info(f"Extracting text from temporary PDF file '{temp_file_path}'...")
        raw_text = extract_text_from_pdf(temp_file_path)

        if not raw_text or not raw_text.strip():
            raise ValueError("Extracted PDF text is empty or unreadable.")

        # Step 4: Create MongoDB metadata record
        metadata_payload = {
            "documentId": document_id,
            "title": title,
            "department": department,
            "documentType": document_type,
            "source_type": source_type,
            "uploadDate": datetime.utcnow(),
            "sourceFile": filename,
            "status": "PENDING_REVIEW"
        }

        logger.info(f"Creating MongoDB document record for '{document_id}'...")
        await create_document(metadata_payload)
        mongo_created = True

        # Step 5: Generate and store vector embeddings in ChromaDB
        embedding_metadata = {
            "documentId": document_id,
            "title": title,
            "department": department,
            "documentType": document_type,
            "date": document_date,
            "source": source,
            "source_type": source_type,
            "status": "PENDING_REVIEW"
        }

        logger.info(f"Generating vector embeddings for '{document_id}'...")
        embed_res = embed_document(raw_text, embedding_metadata)
        embedding_created = embed_res.success

        logger.info(f"Upload workflow successfully finished for documentId '{document_id}'.")
        return UploadResult(
            success=True,
            documentId=document_id,
            title=title,
            department=department,
            chunksProcessed=embed_res.chunksProcessed,
            message="Document uploaded and embedded successfully."
        )

    except Exception as primary_error:
        error_msg = str(primary_error)
        logger.error(f"Upload workflow failed for documentId '{document_id}': {error_msg}")

        # Best-effort compensating rollback strategy
        rollback_attempted = False
        rollback_success = True

        if mongo_created or embedding_created:
            rollback_attempted = True
            logger.warning(f"Initiating compensating rollback for documentId '{document_id}'...")

            # 1. Rollback MongoDB document
            if mongo_created:
                try:
                    logger.info(f"Rollback: Deleting MongoDB document '{document_id}'...")
                    await delete_document(document_id)
                except Exception as r_err:
                    rollback_success = False
                    logger.error(f"Rollback failure (MongoDB deletion) for '{document_id}': {str(r_err)}")

            # 2. Rollback ChromaDB embeddings
            if embedding_created:
                try:
                    logger.info(f"Rollback: Deleting ChromaDB embeddings for '{document_id}'...")
                    delete_document_embeddings(document_id)
                except Exception as r_err:
                    rollback_success = False
                    logger.error(f"Rollback failure (ChromaDB deletion) for '{document_id}': {str(r_err)}")

        return UploadResult(
            success=False,
            documentId=document_id,
            title=title,
            department=department,
            chunksProcessed=0,
            message=f"Upload failed: {error_msg}",
            rollbackAttempted=rollback_attempted,
            rollbackSuccess=rollback_success,
            error=error_msg
        )

    finally:
        # Step 6: Always delete temporary file
        if temp_file_path:
            delete_temp_file(temp_file_path)


async def extract_metadata_from_pdf(file_obj: BinaryIO, filename: str, document_type: str) -> Dict[str, Any]:
    """
    Extracts text from PDF and uses Gemini to extract type-specific structured fields.
    """
    import json
    import google.generativeai as genai
    from app.config.settings import settings

    temp_file_path = save_temp_file(file_obj, filename)
    try:
        raw_text = extract_text_from_pdf(temp_file_path)
        if not raw_text or not raw_text.strip():
            return {"title": filename.replace(".pdf", "").replace("_", " ")}

        snippet = raw_text[:5000]

        prompt = f"""
You are an expert government document parser for the InfoSeva portal.
Analyze the following text extracted from an official Indian government document ({document_type}).
Extract and return a valid JSON object strictly adhering to the schema for document type: "{document_type}".

Document Text Snippet:
{snippet}

Schema instructions based on document type:

If document_type is "Scheme":
{{
  "title": "Official Scheme Name",
  "ministry": "Ministry Name if identified, otherwise empty string",
  "department": "Department Name if identified",
  "category": "One of: Agriculture, Health, Housing, Education, Finance, Energy",
  "benefit": "Quantifiable benefit e.g. ₹6,000/year or subsidy percentage",
  "beneficiaries": "Target group e.g. Small and marginal farmers",
  "launchedYear": "Year e.g. 2024 or 2019",
  "eligibility": "Summary of eligibility criteria",
  "eligibilityQuestions": [
    {{"id": "q1", "text": "Question text?", "expectedAnswer": "Yes"}},
    {{"id": "q2", "text": "Question text?", "expectedAnswer": "Yes"}}
  ],
  "description": "Comprehensive summary of the scheme",
  "documentsRequired": ["Aadhaar Card", "Bank Passbook", "..."],
  "howToApply": ["Step 1 description", "Step 2 description", "..."],
  "faqs": [{{"q": "Question?", "a": "Answer."}}],
  "applyLink": "Official portal URL if found, else empty string"
}}

If document_type is "Scholarship":
{{
  "title": "Scholarship Name",
  "ministry": "Ministry / Department Name",
  "department": "Department Name",
  "category": "Education",
  "educationLevel": "One of: Pre-Matric, Post-Matric, Higher Education, Overseas",
  "benefit": "Financial grant amount e.g. ₹50,000/year",
  "beneficiaries": "Target community / students",
  "applicationDeadline": "YYYY-MM-DD or empty string",
  "eligibility": "Academic and income eligibility criteria",
  "eligibilityQuestions": [
    {{"id": "q1", "text": "Are you currently enrolled in a recognized institution?", "expectedAnswer": "Yes"}},
    {{"id": "q2", "text": "Is your annual family income below the ceiling limit?", "expectedAnswer": "Yes"}}
  ],
  "description": "Scholarship details",
  "documentsRequired": ["Income Certificate", "Mark Sheet", "Aadhaar Card"],
  "howToApply": ["Step 1", "Step 2"],
  "applyLink": "https://scholarships.gov.in or official link",
  "faqs": [{{"q": "Question?", "a": "Answer."}}]
}}

If document_type is "GO" (Government Order):
{{
  "title": "Subject / Title of Order",
  "goNumber": "Order Reference / G.O. Number",
  "ministry": "Ministry Name",
  "department": "Department Name",
  "issueDate": "YYYY-MM-DD",
  "effectiveDate": "YYYY-MM-DD",
  "summary": "Executive summary of directives",
  "directives": "Detailed instructions and operational guidelines"
}}

If document_type is "Notification":
{{
  "title": "Notification Title / Subject",
  "notificationNumber": "Gazette / Notification Number",
  "issuingAuthority": "Authority / Ministry Name",
  "issueDate": "YYYY-MM-DD",
  "effectiveDate": "YYYY-MM-DD",
  "jurisdiction": "All India or specific State",
  "summary": "Summary of statutory notification",
  "keyProvisions": ["Provision 1", "Provision 2"]
}}

If document_type is "Circular":
{{
  "title": "Circular Subject",
  "circularNumber": "Circular / Reference Number",
  "department": "Department Name",
  "issueDate": "YYYY-MM-DD",
  "targetAudience": "Target audience (e.g. All District Collectors)",
  "summary": "Concise summary",
  "actionRequired": "Compliance deadline or action instructions"
}}

If document_type is "Act / Rule":
{{
  "title": "Act / Rule Name",
  "actYear": "Year e.g. 2005",
  "actNumber": "Act Number if available",
  "ministry": "Ministry of Law & Justice or concerned Ministry",
  "enactmentDate": "YYYY-MM-DD",
  "summary": "Key rules, scope, and statutory provisions"
}}

If document_type is "RTI" or "RTI Disclosure":
{{
  "title": "RTI Subject or Inquiry Matter",
  "goNumber": "RTI Reference / File / Appeal Number",
  "department": "Public Authority / Department Name",
  "ministry": "Ministry Name if applicable",
  "issueDate": "YYYY-MM-DD",
  "jurisdiction": "Central Information Commission / State Information Commission / Public Authority",
  "category": "RTI Domain (e.g. Public Information, Land Records, Recruitment, Subsidies)",
  "summary": "Summary of citizen query asked under RTI and the official reply provided"
}}

Output ONLY the JSON object. Do not include markdown formatting or explanations.
CRITICAL RULE:
- Do NOT invent unsupported information.
- If a specific field or value is not explicitly present or verifiable in the text snippet, leave that string field as "" (empty string) and lists as [] (empty list).
"""

        api_key = settings.GEMINI_API_KEY
        if api_key:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(prompt)
            txt = response.text.strip()
            if txt.startswith("```json"):
                txt = txt[7:]
            if txt.startswith("```"):
                txt = txt[3:]
            if txt.endswith("```"):
                txt = txt[:-3]
            txt = txt.strip()
            data = json.loads(txt)
            return data
        else:
            return {"title": filename.replace(".pdf", "").replace("_", " ")}
    except Exception as e:
        logger.warning(f"AI metadata extraction fallback: {str(e)}")
        # Fallback default object
        return {
            "title": filename.replace(".pdf", "").replace("_", " "),
            "description": f"Extracted document from {filename}",
            "category": "Agriculture" if document_type == "Scheme" else "Education" if document_type == "Scholarship" else "General"
        }
    finally:
        delete_temp_file(temp_file_path)

