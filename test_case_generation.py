from llm_utils import get_llm, invoke_llm_for_json

def _create_prompt_template(test_type):
    """
    Selects and returns the appropriate prompt template based on the test type.
    """
    # --- UPDATED PROMPT ---
    # This prompt now ensures detailed test case generation in the specified format.
    common_instructions = (
        "You are an AI assistant tasked with generating detailed test cases. "
        "For each test case, provide the following fields: "
        "ID, Title, Description, Expected Outcome, Type, and Selector. "
        "Ensure the output is formatted as follows: \n"
        "ID: <number> - <Title>\n"
        "Description: <description>\n"
        "Expected outcome: <expected outcome>\n"
        "Type: <type>\n"
        "Selector: <selector>\n"
        "\n"
        "Generate at most 10 test cases based on the input provided."
    )

    if test_type == 'figma':
        return (
            f"{common_instructions} "
            "Input Type: Figma Design. "
            "Figma File Key: {{figma_key}}. "
            "Task: Analyze the design and generate the test cases."
        )

    elif test_type == 'document':
        return (
            f"{common_instructions} "
            "Input Type: Software Requirements Specification (SRS) Document. "
            "File Name: {{file_name}}. "
            "Document Content: {{file_content}}. "
            "Task: Read the requirements and generate the test cases."
        )

    elif test_type == 'manual':
        return (
            f"{common_instructions} "
            "Input Type: Manual Prompt. "
            "User Requirements: {{manual_prompt}}. "
            "Task: Interpret the requirements and generate the test cases."
        )

    elif test_type == 'website':
        return (
            f"{common_instructions} "
            "Input Type: Existing Website URL. "
            "Website URL: {{website_url}}. "
            "Task: Analyze the website and generate the test cases."
        )

    else:
        return None


def generate_test_cases(test_type, input_data):
    """
    Generates test cases for a specific input type using the LLM.
    """
    prompt_template = _create_prompt_template(test_type)

    if not prompt_template:
        return {"error": "Invalid test type", "details": f"The test type '{test_type}' is not supported."}

    llm = get_llm()
    if not llm:
        return {"error": "LLM Initialization Failed", "details": "Could not connect to the language model."}

    # --- UPDATED HANDLING FOR MANUAL PROMPT ---
    if test_type == 'manual':
        if not input_data.get('manual_prompt'):
            return {"error": "Invalid input data", "details": "Manual prompt is missing in the input data."}

    # Debugging logs to trace input data and prompt
    print("Debug: Input Data:", input_data)
    print("Debug: Generated Prompt:", prompt_template)

    try:
        result = invoke_llm_for_json(llm, prompt_template, input_data)
        # Debugging log to capture raw response
        print("Debug: Raw LLM Response:", result)
        return result
    except Exception as e:
        print("Debug: Exception occurred:", str(e))
        return {"error": "LLM Invocation Failed", "details": str(e)}