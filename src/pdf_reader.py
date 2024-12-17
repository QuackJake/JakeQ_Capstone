import pypdf, os

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))  # Current directory of the file
PARENT_DIR = os.path.dirname(ROOT_DIR)
PDF_DIR = os.path.join(PARENT_DIR, 'pdfs\\')

def read_many_pages(filename: str, all: bool, page_count: int = None):
    reader = pypdf.PdfReader(PDF_DIR + filename)
    # page_num = "num_pages: " + str(len(reader.pages))
    # print(page_num)
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


read_many_pages('./test.pdf', False, 2)