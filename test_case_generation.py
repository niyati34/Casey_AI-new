from llm_utils import get_llm, invoke_llm_for_json

def _create_prompt_template(test_type):
    """
    Selects and returns the appropriate prompt template based on the test type.
    """
    # --- UPDATED PROMPT ---
    # This prompt now asks for a simple, comma-separated list, which is more robust.
    common_instructions = """
    Please generate a comma-separated list of the 20 most critical test case names based on the provided input.
    For example: Test Case 1, Test Case 2, Test Case 3
    Do not include any other text, notes, or formatting.
    """

    if test_type == 'figma':
        return f"""
        {common_instructions}

        **Input Type**: Figma Design
        **Figma File Key**: {{figma_key}}
        **Analysis Task**: Analyze the design and generate a comma-separated list of the 20 most critical test case names.
        """
    
    elif test_type == 'document':
        return f"""
        {common_instructions}

        **Input Type**: Software Requirements Specification (SRS) Document
        **File Name**: {{file_name}}
        **Document Content**: ```{{file_content}}```
        **Analysis Task**: Read the requirements and generate a comma-separated list of the 20 most critical test case names.
        """

    elif test_type == 'manual':
        return f"""
        {common_instructions}

        **Input Type**: Manual Prompt
        **User Requirements**: "{{manual_prompt}}"
        **Analysis Task**: Interpret the requirements and generate a comma-separated list of the 20 most critical test case names.
        """

    elif test_type == 'website':
        return f"""
        {common_instructions}

        **Input Type**: Existing Website URL
        **Website URL**: {{website_url}}
        **Analysis Task**: Analyze the website and generate a comma-separated list of the 20 most critical test case names for its key features.
        """
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

    result = invoke_llm_for_json(llm, prompt_template, input_data)
    
    return result