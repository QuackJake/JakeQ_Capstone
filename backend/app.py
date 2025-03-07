import os, datetime
import file_utils
from ollama_connection import Llama
from file_utils import docx_reader
from datetime import datetime

clio_dir = 'clio_test_exports/'
family_docx = 'family/'
legal_documents_pdf = 'legal_documents/pdf/'
legal_documents_fillable = 'legal_documents/fillable/'
xml_dumps = 'xml/'

model_response_dumps = 'llm_responses'

DUMPS_DIR = 'C:/Capstone/Capstone_2025/backend/dumps/'

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR) # Capstone_2025
TARGET_DIR = os.path.join(DUMPS_DIR, legal_documents_fillable)

# llama = Llama((os.path.join(PARENT_DIR, model_response_dumps)), 'llama3.2')

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
    doc_name = '1353FA_Certificate_of_Service_of_Financial_Declaration.docx'
    docx_utils = docx_reader(TARGET_DIR)
    docx_utils.get_text((TARGET_DIR + doc_name), True)
    # print(docx_utils.extract_metadata((TARGET_DIR + doc_name)))

    # file = LegalFormParser()
    # file_utils.process_legal_form(TARGET_DIR + '1353FA_Certificate_of_Service_of_Financial_Declaration.docx')
    
    # docx_utils.xml_to_docx('backend\\dumps\\legal_documents\\xml\\1353FA_Certificate_of_Service_of_Financial_Declaration.xml', 'C:\\Capstone\\Capstone_2025\\backend\\dumps\\legal_documents\\fillable\\test_doc.docx')

    docx_utils.replace_fields_with_placeholders(TARGET_DIR + doc_name, TARGET_DIR + 'output.docx')

def main():
    test_docx()


if __name__=="__main__":
    main()