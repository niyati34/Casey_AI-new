import re
import json
from llm_utils import get_llm, invoke_llm

def _create_prompt_template(test_type):
    """
    Selects and returns the appropriate prompt template based on the test type.
    This prompt is now more explicit, asking for a JSON array to ensure a structured response,
    and properly escapes the example curly braces.
    """
    common_instructions = (
                "You are an expert QA engineer. Your task is to generate a JSON array of test case objects based on the provided input. "
                "Each object in the array must have the following keys: 'id', 'name', 'description', 'type', and 'selector'. "
                "Do not include any introductory text, notes, or any text outside of the JSON array. "
                "The response MUST start with '[' and end with ']'.\n"
                "Generate as many unique and relevant test cases as possible, covering all possible scenarios, edge cases, and variations.\n"
                "Example format:\n"
                """
[
    {{
        "id": 1,
        "name": "Example Test Case",
        "description": "This is an example description.",
        "type": "Functional",
        "selector": "#example-id"
    }}
]
                """
        )

    prompt_map = {
        'figma': f"{common_instructions}\nInput Type: Figma Design\nFigma File Key: {{figma_key}}",
        'document': f"{common_instructions}\nInput Type: SRS Document\nFile Name: {{file_name}}\nDocument Content: ```{{file_content}}```",
        'manual': f"{common_instructions}\nInput Type: Manual Prompt\nUser Requirements: \"{{manual_prompt}}\"",
        'website': f"{common_instructions}\nInput Type: Website URL\nWebsite URL: {{website_url}}"
    }
    return prompt_map.get(test_type)

def _parse_llm_response(response_text):
    """
    Parses the raw text response from the LLM to extract a list of test case dictionaries.
    This function is robust and can handle variations in the AI's output.
    """
    try:
        # The most reliable way to find the JSON is to look for the start and end of the array
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            return json.loads(json_str)
        else:
            # Fallback for older parsing if the above fails
            test_cases = []
            # Regex to find individual test case blocks
            pattern = re.compile(
                r"ID:\s*(?P<id>\d+)\s*-\s*(?P<name>.*?)\n"
                r"Description:\s*(?P<description>.*?)\n"
                r"Type:\s*(?P<type>.*?)\n"
                r"Selector:\s*(?P<selector>.*)",
                re.DOTALL | re.MULTILINE
            )
            for match in pattern.finditer(response_text):
                data = match.groupdict()
                test_cases.append({
                    "id": int(data['id']),
                    "name": data['name'].strip(),
                    "description": data['description'].strip(),
                    "type": data['type'].strip(),
                    "selector": data['selector'].strip()
                })
            return test_cases
    except (json.JSONDecodeError, AttributeError):
        print("Error: Could not parse JSON from LLM response.")
        return []


def generate_test_cases(test_type, input_data):
    """
    Generates and parses test cases for a specific input type using the LLM.
    """
    prompt_template = _create_prompt_template(test_type)
    if not prompt_template:
        return {"error": "Invalid test type", "details": f"The test type '{test_type}' is not supported."}

    llm = get_llm()
    if not llm:
        return {"error": "LLM Initialization Failed", "details": "Could not connect to the language model."}

    raw_response = invoke_llm(llm, prompt_template, input_data)

    if isinstance(raw_response, dict) and 'error' in raw_response:
        return raw_response

    parsed_tests = _parse_llm_response(raw_response)

    if not parsed_tests:
        return {"error": "Parsing Failed", "details": "Could not extract valid test cases from the AI response. Please try again."}

    # Re-number test case IDs to be sequential and clean, ensuring consistency
    for i, test in enumerate(parsed_tests):
        test['id'] = i + 1

    return parsed_tests
