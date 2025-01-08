import os
from pdf_utils import PdfReaderUtils

dirname = 'pdf_reader_src\\pdfs\\'

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR) # Capstone_2025
TARGET_DIR = os.path.join(PARENT_DIR, dirname)

def pprint_dir_tree():
    print(f'Parent Directory: {PARENT_DIR}')
    print(f'Current Directory: {CURRENT_DIR}')
    print(f'Target Directory: {TARGET_DIR}')
    print(f"Target directory contents: {os.listdir(TARGET_DIR)}")

def main():
    pdf_utils = PdfReaderUtils(TARGET_DIR)
    pdf_utils.write_text_to_file('test.pdf', 'output.txt', False, 2)
    pdf_utils.pdf_diagnostic('test.pdf')

if __name__=="__main__":
    main()