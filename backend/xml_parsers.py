import xml.etree.ElementTree as ET
import re, os, json
from bs4 import BeautifulSoup
from collections import defaultdict

def extract_dynamic_form_fields(xml_content):
    soup = BeautifulSoup(xml_content, 'xml')
    
    form_fields = defaultdict(list)
    
    document_structure = extract_document_structure(soup)
    
    for i in document_structure:
        print(i)
    
    # ===== FIND ALL TEXT ELEMENTS =====
    all_text = []
    text_elements = soup.find_all('w:t')
    
    # Process all text elements to extract their content
    for text_elem in text_elements:
        text = text_elem.get_text()
        if text.strip():
            all_text.append(text)
    
    # Join all text content for header identification
    full_text = ' '.join(all_text)
    
    # ===== IDENTIFY HEADERS =====
    # Look for potential section headers (text in paragraphs with different formatting)
    headers = []
    paragraphs = soup.find_all('w:p')
    
    for p in paragraphs:
        # Check if paragraph has formatting that suggests it's a header
        if p.find('w:b') or p.find('w:jc', {'w:val': 'center'}):
            text = p.get_text().strip()
            if text and len(text) > 3:  # Minimum length to be considered a header
                headers.append(text)
    
    form_fields['identified_headers'] = headers
    
    # ===== PROCESS TEXT FOR FORM FIELDS =====
    # 1. Find all checkboxes
    checkboxes = []
    
    for i, text in enumerate(all_text):
        checkbox_matches = list(re.finditer(r'\[\s*\]', text))
        
        for match in checkbox_matches:
            # Extract label (text after the checkbox)
            after_text = text[match.end():].strip()
            before_text = text[:match.start()].strip()
            
            label = extract_checkbox_label(after_text, before_text)
            
            # Get context (try to identify section based on previous headers)
            context = get_context_for_element(i, all_text, headers)
            
            checkboxes.append({
                'label': label,
                'context': context,
                'text': text.strip()
            })
    
    form_fields['checkboxes'] = checkboxes
    
    # 2. Find all underscore fields (both ___ and blank lines with ______)
    underscore_fields = []
    
    for i, text in enumerate(all_text):
        # Find explicit underscores
        underscore_matches = list(re.finditer(r'_{3,}', text))
        
        for match in underscore_matches:
            # Try to extract label (text before the underscores)
            before_text = text[:match.start()].strip()
            label = extract_field_label(before_text)
            
            # Get context
            context = get_context_for_element(i, all_text, headers)
            
            underscore_fields.append({
                'label': label,
                'length': match.end() - match.start(),
                'context': context,
                'text': text.strip()
            })
        
        # Also check for lines that have blank spaces indicated by sequences like "______"
        if "______" in text and not underscore_matches:
            label = extract_field_label(text.split("______")[0].strip())
            context = get_context_for_element(i, all_text, headers)
            
            underscore_fields.append({
                'label': label,
                'context': context,
                'text': text.strip()
            })
    
    form_fields['underscore_fields'] = underscore_fields
    
    # 3. Detect table cells that might be form fields
    table_fields = detect_table_form_fields(soup)
    form_fields['table_fields'] = table_fields
    
    # 4. Look for other common form field patterns
    other_fields = []
    
    # Patterns like "Email: " followed by nothing or whitespace
    for i, text in enumerate(all_text):
        field_patterns = [
            r'([A-Za-z\s]+):\s*$',  # Label followed by colon and nothing
            r'([A-Za-z\s]+):\s*_+',  # Label followed by colon and underscores
            r'Enter ([A-Za-z\s]+)',  # "Enter X" instructions
            r'([A-Za-z\s]+) \(required\)',  # Fields marked as required
        ]
        
        for pattern in field_patterns:
            matches = list(re.finditer(pattern, text))
            for match in matches:
                label = match.group(1).strip()
                context = get_context_for_element(i, all_text, headers)
                
                other_fields.append({
                    'label': label,
                    'pattern': pattern,
                    'context': context,
                    'text': text.strip()
                })
    
    form_fields['other_fields'] = other_fields
    
    return form_fields

def extract_document_structure(soup):
    """Extract the document's structural elements to help identify sections."""
    structure = []
    
    # Look for styled paragraphs that might indicate structure
    for p in soup.find_all('w:p'):
        # Check for paragraph styling
        style = p.find('w:pStyle')
        if style and 'w:val' in style.attrs:
            style_val = style['w:val']
            text = p.get_text().strip()
            if text:
                structure.append({
                    'type': style_val,
                    'text': text
                })
    
    return structure

def extract_checkbox_label(after_text, before_text):
    """Extract a label for a checkbox from text before or after it."""
    # Try to get label from text after checkbox
    if after_text:
        # Look for the first phrase (ending with period, comma, or newline)
        match = re.match(r'^([^\.,:;\n]+)', after_text)
        if match:
            return match.group(1).strip()
    
    # If no label found after, try looking before
    if before_text:
        # Look for the last phrase
        match = re.search(r'([^\.,:;\n]+)$', before_text)
        if match:
            return match.group(1).strip()
    
    return "Unlabeled checkbox"

def extract_field_label(text):
    """Extract a potential label from text before a form field."""
    if not text:
        return "Unlabeled field"
    
    # Remove common field indicators like ":" at the end
    text = re.sub(r':$', '', text.strip())
    
    # Return the last few words as the likely label
    words = text.split()
    if len(words) <= 3:
        return text
    else:
        return ' '.join(words[-3:])

def get_context_for_element(index, all_text, headers, context_window=3):
    """
    Try to determine the context for a form field based on its position 
    in the document and proximity to headers.
    """
    # Look for nearby headers in previous text
    for i in range(max(0, index-context_window), index):
        if all_text[i] in headers:
            return f"Section: {all_text[i]}"
    
    # If no header found, use surrounding text
    start = max(0, index-1)
    end = min(len(all_text), index+2)
    context = ' '.join(all_text[start:end]).strip()
    
    # Truncate if too long
    if len(context) > 100:
        context = context[:97] + "..."
    
    return context

def detect_table_form_fields(soup):
    """Detect potential form fields in tables."""
    table_fields = []
    
    # Find all tables
    tables = soup.find_all('w:tbl')

    for table in tables:
        # Iterate through each row in the table
        rows = table.find_all('w:tr')
        
        for row in rows:
            cells = row.find_all('w:tc')
            print(cells.prettify())
            for cell in cells:
                cell_text = cell.get_text().strip()
                # cell_text = cell_text.replace(" ", "").replace("\n", "")
                # print(cell_text)
                # # Check if the cell might be a form field (empty or minimal text)
                # if not cell_text or cell_text == "" or re.match(r'^_{3,}$', cell_text):
                #     # Look for header/label in the same row
                #     if len(cells) > 1:
                #         label = cells[0].get_text().strip() if cells[0] != cell else ''
                        
                #         if label:
                #             table_fields.append({
                #                 'label': label,
                #                 'row_text': ' '.join([c.get_text().strip() for c in cells if c != cell])
                #             })
                #         else:
                #             # Try to get context from previous row if no label
                #             prev_row = row.find_previous_sibling('w:tr')
                #             if prev_row:
                #                 prev_text = prev_row.get_text().strip()
                #                 table_fields.append({
                #                     'label': 'Unlabeled field',
                #                     'context': prev_text[:100] if len(prev_text) > 100 else prev_text
                #                 })

    return table_fields

def print_dynamic_fields(fields):
    """Print identified form fields in the order they appear in the document."""
    print("===== DYNAMICALLY IDENTIFIED FORM FIELDS =====")

    # Combined list of all form fields, keeping track of their order
    all_fields = []
    
    # Add headers to the list first
    if fields['identified_headers']:
        for header in fields['identified_headers']:
            all_fields.append({'type': 'Header', 'label': header})

    # Add checkboxes
    if fields['checkboxes']:
        for checkbox in fields['checkboxes']:
            all_fields.append({'type': 'Checkbox', 'label': checkbox['label'], 'context': checkbox['context']})

    # Add underscore fields
    if fields['underscore_fields']:
        for field in fields['underscore_fields']:
            all_fields.append({'type': 'Underscore Field', 'label': field['label'], 'length': field.get('length', None), 'context': field['context']})

    # Add table fields
    if fields['table_fields']:
        for table_field in fields['table_fields']:
            all_fields.append({'type': 'Table Field', 'label': table_field['label'], 'context': table_field.get('context', 'No context')})

    # Add other fields
    if fields['other_fields']:
        for other_field in fields['other_fields']:
            all_fields.append({'type': 'Other Field', 'label': other_field['label'], 'context': other_field['context']})

    # Print all fields in the order they appear
    for i, field in enumerate(all_fields, 1):
        field_type = field['type']
        label = field['label']
        context = field.get('context', 'No context')
        length_info = f"(Length: {field.get('length', '')})" if 'length' in field else ""
        
        print(f"{i}. {field_type}: {label} {length_info} - Context: {context}")


def analyze_docx_xml(file_path):
    """Analyze a DOCX XML file to identify potential form fields."""
    if not os.path.exists(file_path):
        print(f"File '{file_path}' not found. Please check the path.")
        return
    
    with open(file_path, 'r', encoding='utf-8') as file:
        xml_content = file.read()
    
    form_fields = extract_dynamic_form_fields(xml_content)
    print_dynamic_fields(form_fields)
    
    return form_fields

def test(file_path):
    if not os.path.exists(file_path):
        print(f"File '{file_path}' not found. Please check the path.")
        return
    
    with open(file_path, 'r', encoding='utf-8') as file:
        xml_content = file.read()

    soup = BeautifulSoup(xml_content, 'xml')
    detect_table_form_fields(soup)

# Example usage
if __name__ == "__main__":
    xml_file_path = "C:/Classes/Capstone/Capstone_2025/backend/dumps/legal_documents/xml/1353FA_Certificate_of_Service_of_Financial_Declaration.xml"  # Change to your actual file path
    # form_fields = analyze_docx_xml(xml_file_path)
    # with open('C:/Classes/Capstone/Capstone_2025/backend/dumps/legal_documents/xml/test.json', 'w') as f:
    #         json.dump(form_fields, f, indent=4)
    test(xml_file_path)