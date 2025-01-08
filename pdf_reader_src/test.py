import pypdf
import os
from typing import Union, List
from pypdf.errors import EmptyFileError

class PdfReaderUtils:
    def __init__(self, target_dir: str):
        self.target_dir = target_dir
        # Ensure target directory exists
        if not os.path.exists(target_dir):
            raise ValueError(f"Target directory does not exist: {target_dir}")

    def _get_pdf_path(self, filename: str) -> str:
        """Helper method to get full PDF path and verify file exists."""
        full_path = os.path.join(self.target_dir, filename)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"PDF file not found: {full_path}")
        if os.path.getsize(full_path) == 0:
            raise EmptyFileError(f"PDF file is empty: {full_path}")
        return full_path

    def _get_output_path(self, filename: str) -> str:
        """Helper method to get full output path and ensure directory exists."""
        output_path = os.path.join(self.target_dir, filename)
        output_dir = os.path.dirname(output_path)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        return output_path

    def get_page_count(self, filename: str) -> int:
        """Get the total number of pages in a PDF file."""
        try:
            pdf_path = self._get_pdf_path(filename)
            reader = pypdf.PdfReader(pdf_path)
            return len(reader.pages)
        except EmptyFileError as e:
            raise EmptyFileError(f"Cannot read empty PDF file: {filename}") from e
        except Exception as e:
            raise RuntimeError(f"Error reading PDF file {filename}: {str(e)}") from e

    def extract_text_from_pages(self, filename: str, all_pages: bool = True, page_count: int = None) -> List[str]:
        """Extract text content from PDF pages."""
        if not all_pages and page_count is None:
            raise ValueError("page_count is required when all_pages is False")
            
        try:
            pdf_path = self._get_pdf_path(filename)
            reader = pypdf.PdfReader(pdf_path)
            extracted_text = []
            
            for i, page in enumerate(reader.pages):
                if not all_pages and i >= page_count:
                    break
                text = page.extract_text()
                extracted_text.append(text)
                
            return extracted_text
        except Exception as e:
            raise RuntimeError(f"Error extracting text from PDF {filename}: {str(e)}") from e

    def extract_bytes_from_pages(self, filename: str, all_pages: bool = True, page_count: int = None) -> List[Union[bytes, None]]:
        """Extract raw bytes content from PDF pages."""
        if not all_pages and page_count is None:
            raise ValueError("page_count is required when all_pages is False")
            
        try:
            pdf_path = self._get_pdf_path(filename)
            reader = pypdf.PdfReader(pdf_path)
            extracted_bytes = []
            
            for i, page in enumerate(reader.pages):
                if not all_pages and i >= page_count:
                    break
                content = page.get_contents()
                extracted_bytes.append(content)
                
            return extracted_bytes
        except Exception as e:
            raise RuntimeError(f"Error extracting bytes from PDF {filename}: {str(e)}") from e

    def write_text_to_file(self, pdf_filename: str, output_filename: str, all_pages: bool = True, page_count: int = None) -> str:
        """Write extracted text content to a file."""
        try:
            pages = self.extract_text_from_pages(pdf_filename, all_pages, page_count)
            output_path = self._get_output_path(output_filename)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(f"Extracted from: {pdf_filename}\n")
                f.write(f"Total pages: {self.get_page_count(pdf_filename)}\n\n")
                
                for i, page_content in enumerate(pages, 1):
                    f.write(f"--- Page {i} ---\n")
                    f.write(page_content)
                    f.write("\n\n")
            
            return output_path
        except Exception as e:
            raise RuntimeError(f"Error writing text to file {output_filename}: {str(e)}") from e

    def write_bytes_to_file(self, pdf_filename: str, output_filename: str, all_pages: bool = True, page_count: int = None) -> str:
        """Write raw bytes content to a file."""
        try:
            pages = self.extract_bytes_from_pages(pdf_filename, all_pages, page_count)
            output_path = self._get_output_path(output_filename)
            
            with open(output_path, 'wb') as f:
                f.write(f"Extracted from: {pdf_filename}\n".encode('utf-8'))
                f.write(f"Total pages: {self.get_page_count(pdf_filename)}\n\n".encode('utf-8'))
                
                for i, page_content in enumerate(pages, 1):
                    f.write(f"--- Page {i} ---\n".encode('utf-8'))
                    if page_content is not None:
                        f.write(page_content)
                    else:
                        f.write(b"[No content available for this page]")
                    f.write(b"\n\n")
            
            return output_path
        except Exception as e:
            raise RuntimeError(f"Error writing bytes to file {output_filename}: {str(e)}") from e
    
try:
    ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
    PARENT_DIR = os.path.dirname(ROOT_DIR) # Capstone_2025
    TARGET_DIR = os.path.join(PARENT_DIR, 'pdf_reader_src\\pdfs\\')
    
    pdf_utils = PdfReaderUtils(TARGET_DIR)
    result = pdf_utils.write_text_to_file('test.pdf', 'output.txt', False, 2)
    print(f"Successfully wrote to: {result}")
except FileNotFoundError as e:
    print(f"File error: {e}")
except EmptyFileError as e:
    print(f"Empty file error: {e}")
except Exception as e:
    print(f"An error occurred: {e}")