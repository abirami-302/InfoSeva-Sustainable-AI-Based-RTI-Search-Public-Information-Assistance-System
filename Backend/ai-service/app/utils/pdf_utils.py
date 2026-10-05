import os
from pypdf import PdfReader
from app.utils.text_utils import clean_text
from app.config.logging_config import get_logger

logger = get_logger(__name__)


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text content from a PDF document given its file path.
    """
    if not os.path.exists(file_path):
        logger.error(f"PDF file not found at path: '{file_path}'")
        raise FileNotFoundError(f"PDF file not found at: {file_path}")

    try:
        reader = PdfReader(file_path)

        if reader.is_encrypted:
            logger.warning(f"PDF file '{file_path}' is encrypted. Attempting empty password decrypt...")
            try:
                decrypted = reader.decrypt("")
                if not decrypted:
                    raise ValueError("Encrypted PDF requires a password.")
            except Exception as e:
                raise ValueError(f"Cannot read encrypted PDF file: {str(e)}") from e

        extracted_pages = []
        for index, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                extracted_pages.append(page_text)
            else:
                logger.debug(f"Page {index + 1} in '{file_path}' contained no extractable text.")

        full_text = "\n\n".join(extracted_pages)
        cleaned_text = clean_text(full_text)

        logger.info(f"Extracted {len(cleaned_text)} characters across {len(reader.pages)} pages from '{file_path}'.")
        return cleaned_text

    except Exception as e:
        logger.error(f"Error extracting text from PDF '{file_path}': {str(e)}")
        raise RuntimeError(f"PDF text extraction failed: {str(e)}") from e
