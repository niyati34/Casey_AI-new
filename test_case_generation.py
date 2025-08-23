import re
import json
from typing import List, Dict, Any
from llm_utils import get_llm, invoke_llm
from jsonschema import validate as jsonschema_validate
from jsonschema.exceptions import ValidationError as JsonSchemaValidationError

def _create_prompt_template(test_type):
    """
    Selects and returns the appropriate prompt template based on the test type.
    This prompt is now more explicit, asking for a JSON array to ensure a structured response,
    and properly escapes the example curly braces.
    """
    common_instructions = (
                "You are an expert QA engineer. Generate a JSON array of test case objects from the provided input. "
                "Strictly output ONLY a JSON array (no prose). Start with '[' and end with ']'. "
                "Each object must include: 'id' (integer), 'name' (string), 'description' (string), 'type' (string: one of UI, Functional, API), "
                "and 'selector' (for UI/Functional) OR 'endpoint' (for API). "
                "Favor realistic, actionable steps with clear selectors or endpoints. "
                "Cover core flows and edge cases.\n"
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

def _parse_llm_response(response_text: str) -> List[Dict[str, Any]]:
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


SCHEMA = {
    "type": "array",
    "items": {
        "type": "object",
        "required": ["id", "name", "description"],
        "properties": {
            "id": {"type": "integer", "minimum": 1},
            "name": {"type": "string", "minLength": 1},
            "description": {"type": "string", "minLength": 1},
            "type": {"type": "string"},
            "selector": {"type": "string"},
            "endpoint": {"type": "string"},
            "method": {"type": "string"}
        },
        "additionalProperties": True
    }
}

def _validate_and_repair(tests: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    # Basic normalization and fill-ins
    norm: List[Dict[str, Any]] = []
    for i, t in enumerate(tests, start=1):
        item = dict(t)
        item["id"] = int(item.get("id", i))
        item["name"] = item.get("name") or f"Test {i}"
        item["description"] = item.get("description") or ""
        # Coerce type bucket
        ty = (item.get("type") or "").strip().lower()
        if ty in ("ui", "functional", "smoke", "regression"):
            item["type"] = "UI"
        elif ty in ("api", "http"):
            item["type"] = "API"
        else:
            item["type"] = item.get("type") or "Functional"
        norm.append(item)

    # Schema validate if jsonschema is present
    if jsonschema_validate:
        try:
            jsonschema_validate(instance=norm, schema=SCHEMA)
        except JsonSchemaValidationError as e:
            # If validation fails, try minimal repair: ensure ids are ints, non-empty strings
            repaired = []
            for i, t in enumerate(norm, start=1):
                t["id"] = int(t.get("id", i))
                t["name"] = str(t.get("name", f"Test {i}")).strip() or f"Test {i}"
                t["description"] = str(t.get("description", "")).strip() or "No description"
                repaired.append(t)
            norm = repaired
            # Best effort, skip re-raising
    return norm


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

    # Primary attempt
    raw_response = invoke_llm(llm, prompt_template, input_data)

    if isinstance(raw_response, dict) and 'error' in raw_response:
        return raw_response

    parsed_tests = _parse_llm_response(raw_response)

    # Retry once with stricter instruction if parsing failed
    if not parsed_tests:
        strict_template = prompt_template + "\nIMPORTANT: Output only a strict JSON array with objects, no backticks, no prose."
        raw_response = invoke_llm(llm, strict_template, input_data)
        if isinstance(raw_response, dict) and 'error' in raw_response:
            return raw_response
        parsed_tests = _parse_llm_response(raw_response)

    if not parsed_tests:
        return {"error": "Parsing Failed", "details": "Could not extract valid test cases from the AI response. Please try again."}

    # Normalize, validate, and re-number
    cleaned = _validate_and_repair(parsed_tests)
    for i, t in enumerate(cleaned, start=1):
        t['id'] = i
    return cleaned
