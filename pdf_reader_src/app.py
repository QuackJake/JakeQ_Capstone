import os, datetime
import file_utils
from ollama_connection import Llama
from file_utils import pdf_reader, docx_reader, LegalFormParser
from datetime import datetime

dirname = 'pdf_reader_src\\pdfs\\'
clio_dir = 'pdf_reader_src\\clio_test_exports\\'
legal_documents_pdf = 'pdf_reader_src\\legal_documents\\pdf\\'
legal_documents_fillable = 'pdf_reader_src\\legal_documents\\fillable\\'

model_response_dumps = 'pdf_reader_src\\response_dumps'

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR) # Capstone_2025
TARGET_DIR = os.path.join(PARENT_DIR, legal_documents_pdf)

llama = Llama((os.path.join(PARENT_DIR, model_response_dumps)), 'llama3.2')

METADATA = {
    "/Author": "Jake Quackenbush",
    "/Producer": "Custom PDF Generator",
    "/Title": "Sample Document",
    "/Subject": "Example Metadata",
    "/Keywords": "PDF, metadata, example",
    "/CreationDate": datetime.now(),
    "/ModDate": datetime.now(),
    "/Creator": "PDFMetadataUpdater",
    "/CustomField": "Custom Value"
}
def print_dir_tree():
    print(f'Parent Directory: {PARENT_DIR}')
    print(f'Current Directory: {CURRENT_DIR}')
    print(f'Target Directory: {TARGET_DIR}')
    print(f"Target directory contents: {os.listdir(TARGET_DIR)}")

def main():
    pdf_name = '1102FA_Stipulated_Motion.pdf'
    pdf_utils = pdf_reader(TARGET_DIR)
    # pdf_utils.write_text_to_file(pdf_name, None, False, 2)

    pdf_text = ''.join(pdf_utils.extract_text_from_pages(pdf_name, True, None))
    print(pdf_text)

    # pdf_utils.parse_clio_pdf(pdf_name, True, None)

    pdf_utils.pdf_diagnostic(pdf_name)
    llama.test(pdf_text)
    # pdf_utils.update_metadata(pdf_name, metadata_template)

    # docx_utils = docx_reader('pdf_reader_src/legal_documents/fillable/')
    # docx_utils.pro()

    # file = LegalFormParser()
    # file_utils.process_legal_form(TARGET_DIR + '1353FA_Certificate_of_Service_of_Financial_Declaration.docx')

if __name__=="__main__":
    main()