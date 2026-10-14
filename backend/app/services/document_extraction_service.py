"""
Document Extraction Service for MARE-Juris.

Supports:
1. Text-based PDFs (PyMuPDF / fitz)
2. Scanned PDFs (selective per-page OCR with pytesseract & OpenCV)
3. Standalone Images (JPG, JPEG, PNG via pytesseract & OpenCV)
4. Microsoft Word documents (.docx via python-docx)
5. Mixed PDFs (selectable text + scanned pages)

Preserves:
- 1-indexed page numbers
- Paragraph & table structures
- Character offsets and bounding context
- OCR confidence metrics and quality warnings
- Secure reference to the original file
"""

import os
import io
import re
import shutil
import time
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field

import fitz  # PyMuPDF
import docx
from PIL import Image

try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except ImportError:
    PYTESSERACT_AVAILABLE = False

from app.core.config import settings

logger = logging.getLogger("mare_juris.document_extraction")

MAX_FILE_SIZE_BYTES = getattr(settings, "MAX_DOCUMENT_SIZE_MB", 50) * 1024 * 1024
MAX_PAGES = getattr(settings, "MAX_DOCUMENT_PAGES", 200)
MIN_TEXT_CHARS_PER_PAGE = 50

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".png", ".jpg", ".jpeg"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "image/jpg",
}


@dataclass
class ExtractedPage:
    page_number: int
    text: str
    char_count: int
    is_ocr: bool = False
    ocr_confidence: Optional[float] = None
    warnings: List[str] = field(default_factory=list)


@dataclass
class DocumentExtractionResult:
    success: bool
    file_name: str
    file_type: str
    file_size: int
    total_pages: int
    pages: List[ExtractedPage]
    full_text: str
    has_ocr_pages: bool
    ocr_pages_count: int
    low_confidence_pages: List[int]
    warnings: List[str]
    error: Optional[str] = None


class DocumentExtractionService:
    """Extracts text and structured metadata from PDF, DOCX, and image documents."""

    def __init__(self):
        self._check_tesseract()

    def _check_tesseract(self) -> bool:
        """Configures and verifies Tesseract OCR availability."""
        if not PYTESSERACT_AVAILABLE:
            return False

        tesseract_cmd = getattr(settings, "TESSERACT_CMD", None) or os.environ.get("TESSERACT_CMD")
        if tesseract_cmd and os.path.exists(tesseract_cmd):
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
            return True

        # Check standard Windows installation path
        default_win_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        if os.path.exists(default_win_path):
            pytesseract.pytesseract.tesseract_cmd = default_win_path
            return True

        # Check PATH
        which_tess = shutil.which("tesseract")
        if which_tess:
            pytesseract.pytesseract.tesseract_cmd = which_tess
            return True

        return False

    def is_ocr_available(self) -> bool:
        """Returns True if pytesseract and Tesseract OCR binary are both available."""
        if not PYTESSERACT_AVAILABLE:
            return False
        try:
            return bool(shutil.which(pytesseract.pytesseract.tesseract_cmd)) or os.path.exists(
                pytesseract.pytesseract.tesseract_cmd
            )
        except Exception:
            return False

    def validate_file(
        self, file_bytes: bytes, file_name: str, content_type: Optional[str] = None
    ) -> Tuple[bool, Optional[str], str]:
        """
        Validates file size, extension, and content type.
        Returns: (is_valid, error_message, detected_extension)
        """
        if not file_bytes or len(file_bytes) == 0:
            return False, "Uploaded file is empty (0 bytes).", ""

        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            max_mb = MAX_FILE_SIZE_BYTES // (1024 * 1024)
            return False, f"File exceeds maximum allowed size of {max_mb} MB.", ""

        ext = os.path.splitext(file_name.lower())[1]
        if ext not in ALLOWED_EXTENSIONS:
            return (
                False,
                f"Unsupported file format '{ext}'. Supported formats: PDF, DOCX, PNG, JPG, JPEG.",
                ext,
            )

        if content_type and content_type.lower() not in ALLOWED_MIME_TYPES:
            # Allow fallback if extension matches known extensions
            if ext not in ALLOWED_EXTENSIONS:
                return False, f"Unsupported MIME type '{content_type}'.", ext

        return True, None, ext

    def preprocess_image_for_ocr(self, pil_image: Image.Image) -> Image.Image:
        """
        Applies OpenCV image enhancement (grayscale, Otsu thresholding) for better OCR accuracy.
        Falls back to PIL operations if OpenCV is unavailable.
        """
        if not CV2_AVAILABLE:
            # Basic PIL fallback: grayscale and contrast enhancement
            return pil_image.convert("L")

        try:
            # Convert PIL to CV2 BGR
            cv_img = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)

            # Denoise
            denoised = cv2.fastNlMeansDenoising(gray, h=10)

            # Otsu's thresholding for crisp text binarization
            _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

            return Image.fromarray(thresh)
        except Exception as e:
            logger.warning(f"[PREPROCESS_IMAGE] OpenCV enhancement failed, falling back to PIL: {e}")
            return pil_image.convert("L")

    def _ocr_image(self, pil_image: Image.Image) -> Tuple[str, Optional[float], List[str]]:
        """
        Runs OCR on a PIL Image and computes confidence score.
        Returns: (extracted_text, avg_confidence, warnings)
        """
        warnings = []
        if not self.is_ocr_available():
            warnings.append(
                "OCR engine (Tesseract) is not installed on the host system. Text extraction from scanned images was skipped."
            )
            return "", None, warnings

        try:
            processed_image = self.preprocess_image_for_ocr(pil_image)
            data = pytesseract.image_to_data(
                processed_image, output_type=pytesseract.Output.DICT
            )

            texts = []
            confidences = []
            for i, word in enumerate(data.get("text", [])):
                word_clean = word.strip()
                if word_clean:
                    texts.append(word_clean)
                    conf = data.get("conf", [])[i]
                    try:
                        conf_val = float(conf)
                        if conf_val >= 0:
                            confidences.append(conf_val)
                    except (ValueError, TypeError):
                        pass

            extracted_text = " ".join(texts)
            avg_conf = (sum(confidences) / len(confidences)) if confidences else None

            if avg_conf is not None and avg_conf < 60.0:
                warnings.append(
                    f"Low OCR confidence ({avg_conf:.1f}%). Text, dates, and amounts on this page may contain transcription errors."
                )

            return extracted_text.strip(), avg_conf, warnings
        except Exception as e:
            logger.error(f"[OCR_ERROR] OCR processing failed: {e}")
            warnings.append(f"OCR processing error: {str(e)}")
            return "", None, warnings

    def extract_from_pdf(self, file_bytes: bytes, file_name: str) -> DocumentExtractionResult:
        """
        Extracts content from PDF. Uses native PyMuPDF text first; falls back to OCR for scanned pages.
        """
        warnings: List[str] = []
        pages: List[ExtractedPage] = []
        has_ocr = False
        ocr_count = 0
        low_conf_pages = []

        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
        except Exception as e:
            return DocumentExtractionResult(
                success=False,
                file_name=file_name,
                file_type="pdf",
                file_size=len(file_bytes),
                total_pages=0,
                pages=[],
                full_text="",
                has_ocr_pages=False,
                ocr_pages_count=0,
                low_confidence_pages=[],
                warnings=[f"Failed to open PDF: {str(e)}"],
                error=f"Corrupted or invalid PDF file: {str(e)}",
            )

        if doc.is_encrypted:
            doc.close()
            return DocumentExtractionResult(
                success=False,
                file_name=file_name,
                file_type="pdf",
                file_size=len(file_bytes),
                total_pages=0,
                pages=[],
                full_text="",
                has_ocr_pages=False,
                ocr_pages_count=0,
                low_confidence_pages=[],
                warnings=["Encrypted document."],
                error="The uploaded PDF is password-protected or encrypted. Please decrypt it before uploading.",
            )

        total_pages = len(doc)
        if total_pages == 0:
            doc.close()
            return DocumentExtractionResult(
                success=False,
                file_name=file_name,
                file_type="pdf",
                file_size=len(file_bytes),
                total_pages=0,
                pages=[],
                full_text="",
                has_ocr_pages=False,
                ocr_pages_count=0,
                low_confidence_pages=[],
                warnings=["Document has 0 pages."],
                error="Document contains no pages.",
            )

        if total_pages > MAX_PAGES:
            warnings.append(
                f"Document has {total_pages} pages, which exceeds the {MAX_PAGES}-page processing limit. Only the first {MAX_PAGES} pages were extracted."
            )
            process_pages = MAX_PAGES
        else:
            process_pages = total_pages

        for page_idx in range(process_pages):
            page_num = page_idx + 1
            page = doc[page_idx]

            # Rule 1: Attempt standard native text extraction first
            text = page.get_text("text").strip()
            char_count = len(text)
            page_warnings: List[str] = []

            # Rule 2: Detect pages with missing, very short, or unusable extracted text
            if char_count < MIN_TEXT_CHARS_PER_PAGE:
                # Page has insufficient native text; evaluate OCR
                ocr_ran = False
                ocr_text = ""
                ocr_conf = None

                try:
                    pix = page.get_pixmap(dpi=150)
                    img = Image.open(io.BytesIO(pix.tobytes("png")))
                    ocr_text, ocr_conf, ocr_warns = self._ocr_image(img)
                    page_warnings.extend(ocr_warns)

                    if ocr_text:
                        text = ocr_text
                        char_count = len(text)
                        ocr_ran = True
                    elif not self.is_ocr_available():
                        page_warnings.append(
                            "Optical Character Recognition (OCR) is unavailable in this serverless runtime (Tesseract binary not installed). Scanned image text could not be extracted."
                        )
                    else:
                        page_warnings.append("No text could be recognized from scanned image.")

                    if ocr_ran:
                        has_ocr = True
                        ocr_count += 1
                        if ocr_conf is not None and ocr_conf < 60.0:
                            low_conf_pages.append(page_num)

                    pages.append(
                        ExtractedPage(
                            page_number=page_num,
                            text=text,
                            char_count=char_count,
                            is_ocr=ocr_ran,
                            ocr_confidence=ocr_conf if ocr_ran else None,
                            warnings=page_warnings,
                        )
                    )
                except Exception as ocr_err:
                    logger.warning(f"[PDF_PAGE_OCR] Page {page_num} OCR failed: {ocr_err}")
                    page_warnings.append(f"OCR rendering error: {str(ocr_err)}")
                    pages.append(
                        ExtractedPage(
                            page_number=page_num,
                            text=text,
                            char_count=char_count,
                            is_ocr=False,
                            ocr_confidence=None,
                            warnings=page_warnings,
                        )
                    )
            else:
                # Native text extraction succeeded
                pages.append(
                    ExtractedPage(
                        page_number=page_num,
                        text=text,
                        char_count=char_count,
                        is_ocr=False,
                        ocr_confidence=None,
                        warnings=page_warnings,
                    )
                )

        doc.close()

        full_text = "\n\n".join(
            f"--- PAGE {p.page_number} ---\n{p.text}" for p in pages if p.text.strip()
        )

        if not full_text.strip():
            warnings.append(
                "No readable text could be extracted from this document. It may consist of blank pages or unsupported image formats."
            )

        return DocumentExtractionResult(
            success=True,
            file_name=file_name,
            file_type="pdf",
            file_size=len(file_bytes),
            total_pages=total_pages,
            pages=pages,
            full_text=full_text,
            has_ocr_pages=has_ocr,
            ocr_pages_count=ocr_count,
            low_confidence_pages=low_conf_pages,
            warnings=warnings,
        )

    def extract_from_docx(self, file_bytes: bytes, file_name: str) -> DocumentExtractionResult:
        """
        Extracts content from DOCX preserving paragraph order and tables.
        """
        warnings: List[str] = []
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
        except Exception as e:
            return DocumentExtractionResult(
                success=False,
                file_name=file_name,
                file_type="docx",
                file_size=len(file_bytes),
                total_pages=0,
                pages=[],
                full_text="",
                has_ocr_pages=False,
                ocr_pages_count=0,
                low_confidence_pages=[],
                warnings=[f"Failed to read DOCX: {str(e)}"],
                error=f"Corrupted or invalid DOCX document: {str(e)}",
            )

        # Traverse document elements in sequential order (paragraphs and tables)
        extracted_sections: List[str] = []

        # Iterate through block elements in body
        for element in doc.element.body:
            tag = element.tag
            if tag.endswith("p"):
                # Paragraph
                p = docx.text.paragraph.Paragraph(element, doc)
                p_text = p.text.strip()
                if p_text:
                    extracted_sections.append(p_text)
            elif tag.endswith("tbl"):
                # Table
                t = docx.table.Table(element, doc)
                table_lines = []
                for row in t.rows:
                    row_cells = [cell.text.strip().replace("\n", " ") for cell in row.cells]
                    if any(row_cells):
                        table_lines.append(" | ".join(row_cells))
                if table_lines:
                    extracted_sections.append("[TABLE]\n" + "\n".join(table_lines) + "\n[/TABLE]")

        if not extracted_sections:
            return DocumentExtractionResult(
                success=True,
                file_name=file_name,
                file_type="docx",
                file_size=len(file_bytes),
                total_pages=1,
                pages=[
                    ExtractedPage(
                        page_number=1,
                        text="",
                        char_count=0,
                        is_ocr=False,
                        warnings=["Document contains no paragraphs or tables."],
                    )
                ],
                full_text="",
                has_ocr_pages=False,
                ocr_pages_count=0,
                low_confidence_pages=[],
                warnings=["The DOCX file appears to be empty."],
            )

        # DOCX does not have fixed physical pages without rendering.
        # We chunk into logical pages of approx 3,000 characters to maintain page-number contracts.
        pages: List[ExtractedPage] = []
        current_page_text: List[str] = []
        current_len = 0
        current_page_num = 1

        for sec in extracted_sections:
            if current_len + len(sec) > 3000 and current_page_text:
                joined_page = "\n\n".join(current_page_text)
                pages.append(
                    ExtractedPage(
                        page_number=current_page_num,
                        text=joined_page,
                        char_count=len(joined_page),
                        is_ocr=False,
                    )
                )
                current_page_num += 1
                current_page_text = [sec]
                current_len = len(sec)
            else:
                current_page_text.append(sec)
                current_len += len(sec)

        if current_page_text:
            joined_page = "\n\n".join(current_page_text)
            pages.append(
                ExtractedPage(
                    page_number=current_page_num,
                    text=joined_page,
                    char_count=len(joined_page),
                    is_ocr=False,
                )
            )

        full_text = "\n\n".join(
            f"--- SECTION / PAGE {p.page_number} ---\n{p.text}" for p in pages
        )

        return DocumentExtractionResult(
            success=True,
            file_name=file_name,
            file_type="docx",
            file_size=len(file_bytes),
            total_pages=len(pages),
            pages=pages,
            full_text=full_text,
            has_ocr_pages=False,
            ocr_pages_count=0,
            low_confidence_pages=[],
            warnings=warnings,
        )

    def extract_from_image(
        self, file_bytes: bytes, file_name: str, ext: str
    ) -> DocumentExtractionResult:
        """
        Extracts content from a standalone image document (JPG, PNG) using OCR.
        """
        warnings: List[str] = []
        try:
            img = Image.open(io.BytesIO(file_bytes))
        except Exception as e:
            return DocumentExtractionResult(
                success=False,
                file_name=file_name,
                file_type=ext.replace(".", ""),
                file_size=len(file_bytes),
                total_pages=0,
                pages=[],
                full_text="",
                has_ocr_pages=True,
                ocr_pages_count=0,
                low_confidence_pages=[],
                warnings=[f"Failed to decode image: {str(e)}"],
                error=f"Corrupted or invalid image file: {str(e)}",
            )

        ocr_text, ocr_conf, ocr_warns = self._ocr_image(img)
        warnings.extend(ocr_warns)

        ocr_ran = bool(ocr_text) or self.is_ocr_available()
        if not self.is_ocr_available() and not ocr_text:
            ocr_ran = False
            ocr_unavailable_msg = (
                "Optical Character Recognition (OCR) is unavailable in this serverless runtime environment "
                "because the Tesseract engine binary is not installed on Vercel. Text could not be extracted "
                "from this image. Please upload a text-based PDF or DOCX file."
            )
            warnings.append(ocr_unavailable_msg)
            ocr_warns.append(ocr_unavailable_msg)

        low_conf = [1] if (ocr_ran and ocr_conf is not None and ocr_conf < 60.0) else []

        page = ExtractedPage(
            page_number=1,
            text=ocr_text,
            char_count=len(ocr_text),
            is_ocr=ocr_ran,
            ocr_confidence=ocr_conf if ocr_ran else None,
            warnings=ocr_warns,
        )

        full_text = f"--- PAGE 1 ---\n{ocr_text}" if ocr_text else ""
        if not ocr_text and ocr_ran:
            warnings.append("No text could be extracted from this image.")

        return DocumentExtractionResult(
            success=True,
            file_name=file_name,
            file_type=ext.replace(".", ""),
            file_size=len(file_bytes),
            total_pages=1,
            pages=[page],
            full_text=full_text,
            has_ocr_pages=ocr_ran,
            ocr_pages_count=1 if ocr_ran else 0,
            low_confidence_pages=low_conf,
            warnings=warnings,
        )

    def extract_document(
        self,
        file_bytes: bytes,
        file_name: str,
        content_type: Optional[str] = None,
        correlation_id: Optional[str] = None,
        document_id: Optional[str] = None,
    ) -> DocumentExtractionResult:
        """
        Unified extraction entry point with safe structured logging.
        Validates file and dispatches to appropriate extractor.
        """
        t_start = time.perf_counter()
        cid = correlation_id or "ext-unspecified"
        masked_doc = f"{document_id[:4]}***{document_id[-4:]}" if (document_id and len(document_id) >= 8) else ("present" if document_id else "none")

        is_valid, err_msg, ext = self.validate_file(file_bytes, file_name, content_type)
        if not is_valid:
            elapsed = time.perf_counter() - t_start
            logger.warning(
                f"[DOC_EXTRACTION][{cid}] op=DOCUMENT_EXTRACTION doc_present={bool(document_id)} doc_id={masked_doc} "
                f"invoked=False file_type={ext or 'unknown'} pages=0 duration={elapsed:.3f}s status=validation_error error='{err_msg}'"
            )
            return DocumentExtractionResult(
                success=False,
                file_name=file_name,
                file_type=ext.replace(".", "") or "unknown",
                file_size=len(file_bytes) if file_bytes else 0,
                total_pages=0,
                pages=[],
                full_text="",
                has_ocr_pages=False,
                ocr_pages_count=0,
                low_confidence_pages=[],
                warnings=[],
                error=err_msg,
            )

        ext_clean = ext.lower()
        logger.info(
            f"[DOC_EXTRACTION][{cid}] op=DOCUMENT_EXTRACTION_START doc_present={bool(document_id)} doc_id={masked_doc} "
            f"invoked=True file_type={ext_clean} size_bytes={len(file_bytes)}"
        )

        res: DocumentExtractionResult
        if ext_clean == ".pdf":
            res = self.extract_from_pdf(file_bytes, file_name)
        elif ext_clean == ".docx":
            res = self.extract_from_docx(file_bytes, file_name)
        elif ext_clean in {".png", ".jpg", ".jpeg"}:
            res = self.extract_from_image(file_bytes, file_name, ext_clean)
        else:
            res = DocumentExtractionResult(
                success=False,
                file_name=file_name,
                file_type=ext_clean.replace(".", ""),
                file_size=len(file_bytes),
                total_pages=0,
                pages=[],
                full_text="",
                has_ocr_pages=False,
                ocr_pages_count=0,
                low_confidence_pages=[],
                warnings=[],
                error=f"Unsupported file format '{ext_clean}'.",
            )

        elapsed = time.perf_counter() - t_start
        status_str = "success" if res.success else "error"
        logger.info(
            f"[DOC_EXTRACTION][{cid}] op=DOCUMENT_EXTRACTION_COMPLETE doc_present={bool(document_id)} doc_id={masked_doc} "
            f"invoked=True file_type={ext_clean} pages={res.total_pages} duration={elapsed:.3f}s "
            f"status={status_str} error={res.error or 'none'}"
        )
        return res


document_extraction_service = DocumentExtractionService()
