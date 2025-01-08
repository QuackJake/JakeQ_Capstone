import pypdf, os, io
from pypdf.errors import EmptyFileError

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(ROOT_DIR) # Capstone_2025
TARGET_DIR = os.path.join(PARENT_DIR, 'pdf_reader_src\\pdfs\\')

def get_pdf_path(filename: str) -> str:
        """Helper method to get full PDF path and verify file exists."""
        full_path = os.path.join(TARGET_DIR, filename)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"PDF file not found: {full_path}")
        if os.path.getsize(full_path) == 0:
            raise EmptyFileError(f"PDF file is empty: {full_path}")
        return full_path

def get_output_path(filename: str) -> str:
    """Helper method to get full output path and ensure directory exists."""
    output_path = os.path.join(TARGET_DIR, filename)
    output_dir = os.path.dirname(output_path)
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    return output_path

def get_page_count(filename: str) -> int:
    """Get the total number of pages in a PDF file."""
    reader = pypdf.PdfReader(TARGET_DIR + filename)
    page_num = "num_pages: " + str(len(reader.pages))

    try:
        reader = pypdf.PdfReader(TARGET_DIR + filename)
        return len(reader.pages)
    except EmptyFileError as e:
        raise EmptyFileError(f"Cannot read empty PDF file: {filename}") from e
    except Exception as e:
        raise RuntimeError(f"Error reading PDF file {filename}: {str(e)}") from e

def extract(filename: str, all: bool, page_count: int = None, extract_bytes: bool = False):
    reader = pypdf.PdfReader(TARGET_DIR + filename)
    page_num = "num_pages: " + str(len(reader.pages))
    print(page_num)
    
    if all:
        for page in reader.pages:
            if extract_bytes:
                # Get the raw bytes content
                content = page.get_contents()
                if content:  # Some pages might not have content
                    # content is already in bytes format
                    print(content)
            else:
                p = page.extract_text()
                print(p)
    else:
        if page_count is None:
            raise ValueError("page_count is required when 'all' is False.")
        for i, page in enumerate(reader.pages):
            if i >= page_count:
                break
            if extract_bytes:
                content = page.get_contents()
                if content:
                    print(content)
            else:
                p = page.extract_text()
                print(p)

def read_many_pages(filename: str, all: bool, page_count: int = None):
    reader = pypdf.PdfReader(TARGET_DIR + filename)
    page_num = "num_pages: " + str(len(reader.pages))
    print(page_num)
    if all:
        for page in reader.pages:
            p = page.extract_text()
            print(p)
    else:
        if page_count is None:
            raise ValueError("page_count is required when 'all' is False.")
        for i, page in enumerate(reader.pages):
            if i >= page_count:
                break
            p = page.extract_text()
            print(p)

def extract_pdf_to_txt(filename: str, all: bool, page_count: int = None, outname: str = None):
    reader = pypdf.PdfReader(TARGET_DIR + filename)
    page_num = "num_pages: " + str(len(reader.pages))

    if not outname:
        outname = (filename.split('.')[0]) + '.txt'
        print(outname)

    print(page_num)
    if all:
        for page in reader.pages:
            p = page.extract_text()
            print(p)
            
    else:
        if page_count is None:
            raise ValueError("page_count is required when 'all' is False.")
        for i, page in enumerate(reader.pages):
            if i >= page_count:
                break
            p = page.extract_text()
            print(p)

    with open(outname, 'w') as o:
                o.write(p)

def bytes(filename):
     with io.BytesIO() as p:
          reader = pypdf.PdfReader(TARGET_DIR + filename)

# read_many_pages('test.pdf', False, 2)
# extract_pdf_to_txt('test.pdf', False, 2)
# print(get_pdf_path('test.pdf'))
# print(get_output_path('test.txt'))
# print(get_page_count('test.pdf'))

print(TARGET_DIR)