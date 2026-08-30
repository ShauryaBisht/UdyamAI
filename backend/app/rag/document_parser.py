import os

import pypdf


class PDFParserError(Exception):
    """Base class for PDF parser exceptions."""

    pass


class CorruptedPDFError(PDFParserError):
    """Raised when the PDF file is corrupted."""

    pass


class EncryptedPDFError(PDFParserError):
    """Raised when the PDF file is encrypted."""

    pass


class EmptyPDFError(PDFParserError):
    """Raised when the PDF file is empty or has no pages."""

    pass


class ScannedPDFError(PDFParserError):
    """Raised when the PDF file is scanned/image-only (no extracted text)."""

    pass


def parse_pdf(file_path: str) -> list[dict]:
    """
    Extracts text page-by-page from a PDF file.

    Returns a list of dicts:
        [{"page_number": 1, "text": "page content"}, ...]

    Raises:
        FileNotFoundError
        EncryptedPDFError
        CorruptedPDFError
        EmptyPDFError
        ScannedPDFError
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    if os.path.getsize(file_path) == 0:
        raise EmptyPDFError("The PDF file is empty (0 bytes).")

    try:
        reader = pypdf.PdfReader(file_path)
    except Exception as e:
        raise CorruptedPDFError(f"Failed to parse corrupted PDF: {str(e)}") from e

    if reader.is_encrypted:
        raise EncryptedPDFError("The PDF file is encrypted and cannot be parsed.")

    num_pages = len(reader.pages)
    if num_pages == 0:
        raise EmptyPDFError("The PDF file has 0 pages.")

    pages_data = []
    total_text_length = 0

    for i, page in enumerate(reader.pages):
        page_num = i + 1
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""

        cleaned_text = text.strip()
        total_text_length += len(cleaned_text)

        pages_data.append({"page_number": page_num, "text": cleaned_text})

    # If the total extracted text across the entire PDF is empty, it is scanned/image-only
    if total_text_length == 0:
        raise ScannedPDFError(
            "The PDF file appears to be scanned or image-only (no text extracted)."
        )

    return pages_data
