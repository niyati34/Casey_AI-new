import os
import re
from docx import Document
import pdfplumber

def read_file_content(file):
    """
    Reads the content of an uploaded file (.docx or .pdf) and returns it as a single string.
    """
    filename = file.filename.lower()
    if filename.endswith('.docx'):
        doc = Document(file)
        return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
    elif filename.endswith('.pdf'):
        with pdfplumber.open(file) as pdf:
            full_text = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text.append(text)
            return "\n".join(full_text)
    return ""

def parse_document_for_tests(file_content):
    """
    Uses Regular Expressions (RegEx) to reliably and quickly parse test cases 
    from a structured document, avoiding the need for an LLM.
    """
    all_tests = []
    
    # This pattern looks for a block of text starting with "ID:" and captures all content
    # until it hits the next "ID:" or the end of the file.
    # re.DOTALL makes '.' match newlines, and re.MULTILINE helps with ^.
    test_case_blocks = re.split(r'\nID:', file_content, flags=re.MULTILINE)

    # The first split item might be a header or empty space, so we skip it.
    for i, block in enumerate(test_case_blocks):
        if not block.strip() or "Generated Test Cases" in block:
            continue

        # Re-add the "ID:" that was removed by the split for consistent parsing
        block_text = "ID:" + block

        # Define the pattern to capture the details of each test case.
        # We use named capture groups (?P<name>...) for easy access.
        pattern = re.compile(
            r"ID:\s*(?P<id>\d+)\s*-\s*(?P<name>.*?)\n"
            r"Description:\s*(?P<description>.*?)\n"
            r"Type:\s*(?P<type>.*?)\n"
            r"Selector:\s*(?P<selector>.*)",
            re.DOTALL
        )
        
        match = pattern.search(block_text)
        
        if match:
            # Extract data from the named groups
            data = match.groupdict()
            
            # Build the test case dictionary in the required format
            all_tests.append({
                "id": int(data['id']),
                "name": data['name'].strip(),
                "description": data['description'].strip(),
                "type": data['type'].strip(),
                "inputs": [],  # Defaulting to an empty list as per the format
                "selector": data['selector'].strip()
            })

    # Re-number test case IDs to be sequential and clean, ensuring consistency
    for i, test in enumerate(all_tests):
        test['id'] = i + 1
        
    return all_tests
