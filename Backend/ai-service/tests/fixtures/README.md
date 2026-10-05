# InfoSeva AI Service Test Fixtures

This directory contains test data and documentation for unit and integration testing.

## PDF Test Fixtures Description

Due to repository size constraints and binary file tracking best practices, mock binary PDF files are described here and generated in-memory during test execution via `unittest.mock` and `io.BytesIO`.

### 1. `sample.pdf`
- **Purpose**: Valid PDF upload and text extraction testing.
- **Expected Format**: Valid PDF 1.4 specification containing text: "PM Kisan is a central sector government scheme providing income support to farmer families."
- **Expected Size**: ~15 KB.

### 2. `corrupted.pdf`
- **Purpose**: Error handling verification for damaged or unreadable PDF files.
- **Expected Format**: Malformed binary file with missing PDF header (`%PDF-1.4`) or truncated body.
- **Expected Behavior**: Throws `ValueError` or `RuntimeError` during PyPDF text extraction.

### 3. `large_sample.pdf`
- **Purpose**: File size validation testing.
- **Expected Format**: Valid PDF exceeding 20 MB limit (21 MB mock payload).
- **Expected Behavior**: Rejected by `file_utils.validate_file_size()` with `ValueError`.
