
import os
import re
from docx import Document
import pdfplumber
from llm_utils import get_llm, invoke_llm

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
    Uses the LLM to extract test cases from a document's content. Falls back to regex if LLM fails.
    """
    llm = get_llm()
    if not llm:
        print("Warning: LLM not available, falling back to regex parsing.")
        return _regex_parse_document_for_tests(file_content)

    prompt_template = (
        "You are an expert QA engineer. Extract all possible test cases from the following document content. "
        "Return a JSON array of test case objects, each with keys: 'id', 'name', 'description', 'type', and 'selector'. "
        "Do not include any text outside the JSON array. The response MUST start with '[' and end with ']'.\n"
        "Document Content: ```{input}```"
    )
    response = invoke_llm(llm, prompt_template, file_content)
    if isinstance(response, dict) and 'error' in response:
        print("Warning: LLM failed, falling back to regex parsing.")
        return _regex_parse_document_for_tests(file_content)

    # Try to parse the LLM's response as JSON
    import json
    import re
    try:
        json_match = re.search(r'\[.*\]', response, re.DOTALL)
        if json_match:
            test_cases = json.loads(json_match.group(0))
        else:
            test_cases = json.loads(response)
    except Exception:
        print("Warning: Could not parse LLM response, falling back to regex parsing.")
        return _regex_parse_document_for_tests(file_content)

    # Re-number test case IDs to be sequential and clean, ensuring consistency
    for i, test in enumerate(test_cases):
        test['id'] = i + 1
    return test_cases

# Fallback regex parser (original logic)
def _regex_parse_document_for_tests(file_content):
    all_tests = []
    test_case_blocks = re.split(r'\nID:', file_content, flags=re.MULTILINE)
    for i, block in enumerate(test_case_blocks):
        if not block.strip() or "Generated Test Cases" in block:
            continue
        block_text = "ID:" + block
        pattern = re.compile(
            r"ID:\s*(?P<id>\d+)\s*-\s*(?P<name>.*?)\n"
            r"Description:\s*(?P<description>.*?)\n"
            r"Type:\s*(?P<type>.*?)\n"
            r"Selector:\s*(?P<selector>.*)",
            re.DOTALL
        )
        match = pattern.search(block_text)
        if match:
            data = match.groupdict()
            all_tests.append({
                "id": int(data['id']),
                "name": data['name'].strip(),
                "description": data['description'].strip(),
                "type": data['type'].strip(),
                "inputs": [],
                "selector": data['selector'].strip()
            })
    for i, test in enumerate(all_tests):
        test['id'] = i + 1
    return all_tests
