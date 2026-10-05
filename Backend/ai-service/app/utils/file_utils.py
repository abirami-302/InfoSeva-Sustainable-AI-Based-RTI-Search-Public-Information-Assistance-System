import os
import shutil
import tempfile
from typing import BinaryIO, Optional
from app.config.logging_config import get_logger

logger = get_logger(__name__)

MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB limit


def validate_pdf(filename: str, content_type: Optional[str] = None) -> bool:
    """
    Validates if uploaded file is a PDF based on extension and content type.
    """
    if not filename:
        raise ValueError("Filename is required for validation.")

    extension_valid = filename.lower().endswith(".pdf")
    content_type_valid = True if content_type is None else content_type.lower() == "application/pdf"

    if not (extension_valid and content_type_valid):
        logger.warning(f"File validation failed for '{filename}'. Only PDF files are accepted.")
        raise ValueError("Invalid file type. Only PDF uploads are supported.")

    return True


def validate_file_size(size_in_bytes: int) -> bool:
    """
    Validates if file size is within 20 MB limit.
    """
    if size_in_bytes <= 0:
        raise ValueError("File size must be greater than zero.")

    if size_in_bytes > MAX_FILE_SIZE_BYTES:
        logger.warning(f"File size {size_in_bytes} bytes exceeds 20MB limit.")
        raise ValueError(f"File size exceeds maximum limit of 20MB (received {size_in_bytes / (1024*1024):.2f}MB).")

    return True


def save_temp_file(file_obj: BinaryIO, filename: str) -> str:
    """
    Saves an uploaded file binary stream to a temporary disk path and returns path.
    """
    suffix = ".pdf" if filename.lower().endswith(".pdf") else ""
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        shutil.copyfileobj(file_obj, temp_file)
        temp_path = temp_file.name
        logger.info(f"Saved temporary file to '{temp_path}'")
        return temp_path
    except Exception as e:
        logger.error(f"Failed to save temporary file for '{filename}': {str(e)}")
        raise RuntimeError(f"Error saving temporary file: {str(e)}") from e
    finally:
        temp_file.close()


def delete_temp_file(file_path: str) -> None:
    """
    Safely deletes a temporary file if it exists.
    """
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
            logger.info(f"Deleted temporary file '{file_path}'")
        except Exception as e:
            logger.error(f"Failed to delete temporary file '{file_path}': {str(e)}")
