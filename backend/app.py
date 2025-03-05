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
TARGET_DIR = os.path.join(PARENT_DIR, legal_documents_fillable)

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

def test_pdfs():
    pdf_name = '1102FA_Stipulated_Motion.pdf'
    pdf_utils = pdf_reader(TARGET_DIR)
    pdf_utils.write_text_to_file(pdf_name, None, False, 2)

    pdf_text = ''.join(pdf_utils.extract_text_from_pages(pdf_name, True, None))
    print(pdf_text)

    pdf_utils.pdf_diagnostic(pdf_name)

    # llama.test(pdf_text)
    # pdf_utils.update_metadata(pdf_name, metadata_template)
    # pdf_utils.parse_clio_pdf(pdf_name, True, None)

def test_docx():
    doc_name = '1353FA_Certificate_of_Service_of_Financial_Declaration.doc'
    docx_utils = docx_reader(TARGET_DIR)
    # print(docx_utils.get_text((TARGET_DIR + doc_name), False))
    print(docx_utils.extract_metadata((TARGET_DIR + doc_name)))

    # file = LegalFormParser()
    # file_utils.process_legal_form(TARGET_DIR + '1353FA_Certificate_of_Service_of_Financial_Declaration.docx')

def main():
    test_docx()


if __name__=="__main__":
    main()