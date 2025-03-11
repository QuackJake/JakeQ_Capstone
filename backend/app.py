import os, datetime
import file_utils
from ollama_connection import Llama
from file_utils import docx_reader
from datetime import datetime
from pathlib import Path

backend_dir = Path(__file__).parent.resolve()

parent_dir = backend_dir.parent
frontend_dir = parent_dir / "frontend"
backend_dir = parent_dir / "backend"

dumps_dir = backend_dir / "dumps"

clio_exports = dumps_dir / 'clio_test_exports'
family_docx = dumps_dir / 'family'
legal_documents = dumps_dir / 'legal_documents'

fillable_dir = legal_documents / 'fillable'
pdf_dir = legal_documents / 'fpdf'
xml_dumps = legal_documents / 'xml'

model_response_dumps = 'llm_responses'


CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR) # Capstone_2025
TARGET_DIR = os.path.join(fillable_dir)

# llama = Llama((os.path.join(PARENT_DIR, model_response_dumps)), 'llama3.2')

# for item in list(dumps_dir.glob("*.docx")):
#     print(item)

# frontend_str = str(frontend_dir)
# print(frontend_str)

# p = Path('.')

# [x for x in p.iterdir() if x.is_dir()]



def error_wrapper(wrapped_function):
    def _wrapper(*args, **kwargs):
        try:
            path = Path(args[0])
            if not path.exists():
                raise FileNotFoundError(f"The specified file or directory does not exist: {args[0]}")
            result = wrapped_function(*args, **kwargs)
            return result
        except FileNotFoundError as e:
            print(f"File/Directory error: {e}")
        except Exception as e:
            print(f"An error occurred: {e}")
    return _wrapper


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

def test_docx():
    doc_name = '/1353FA_Certificate_of_Service_of_Financial_Declaration.docx'
    docx_utils = docx_reader(TARGET_DIR)
    docx_utils.get_text((TARGET_DIR + doc_name), True)
    # print(docx_utils.extract_metadata((TARGET_DIR + doc_name)))

    # file = LegalFormParser()
    # file_utils.process_legal_form(TARGET_DIR + '1353FA_Certificate_of_Service_of_Financial_Declaration.docx')
    
    # docx_utils.xml_to_docx('backend\\dumps\\legal_documents\\xml\\1353FA_Certificate_of_Service_of_Financial_Declaration.xml', 'C:\\Capstone\\Capstone_2025\\backend\\dumps\\legal_documents\\fillable\\test_doc.docx')

    # docx_utils.replace_fields_with_placeholders(TARGET_DIR + doc_name, TARGET_DIR + 'output.docx')

def main():
    test_docx()


if __name__=="__main__":
    main()