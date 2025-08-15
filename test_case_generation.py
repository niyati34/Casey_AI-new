from llm_utils import get_llm, invoke_llm_for_json

def _create_prompt_template(test_type):
    """
    Selects and returns the appropriate prompt template based on the test type.

    This function centralizes all the prompt engineering, making it easy to
    tweak the instructions for the AI for each specific use case.

    Args:
        test_type (str): The type of input ('figma', 'document', 'manual', 'website').

    Returns:
        str: A formatted prompt template with placeholders.
    """
    
    # --- UPDATED INSTRUCTIONS ---
    # The common instructions now ask for an "inputs" array.
    common_instructions = """
    Please generate a list of comprehensive test cases based on the provided input.
    The output must be a valid JSON array of objects. Do not include any text, notes, or formatting outside of this JSON array (e.g., no "```json" wrapper).
    
    Each object in the array should have the following keys:
    - "id": A unique integer for the test case, starting from 1.
    - "name": A short, descriptive name for the test (e.g., "Login Form Validation").
    - "description": A detailed explanation of what the test verifies and the expected outcome.
    - "type": The category of the test (e.g., "UI Interaction", "Form Validation", "User Flow").
    - "inputs": An array of objects representing the data to be entered. Each object should have a "selector" (the CSS selector of the input field) and a "value" (the data to enter). For non-form tests, this can be an empty array.
    - "selector": A suggested CSS selector for the primary element to be clicked or observed after inputs are filled, if applicable.
    """

    if test_type == 'figma':
        return f"""
        {common_instructions}

        **Input Type**: Figma Design
        **Figma File Key**: {{figma_key}}
        **Analysis Task**: Analyze the design elements, component interactions, and user flows implied by the provided Figma file key and generate relevant test cases. For forms, include example input data.
        """
    
    elif test_type == 'document':
        return f"""
        {common_instructions}

        **Input Type**: Software Requirements Specification (SRS) Document
        **File Name**: {{file_name}}
        **Document Content**: ```{{file_content}}```
        **Analysis Task**: Read the requirements in the document content and generate test cases that cover all functional and non-functional specifications. For forms, include example input data.
        """

    elif test_type == 'manual':
        return f"""
        {common_instructions}

        **Input Type**: Manual Prompt
        **User Requirements**: "{{manual_prompt}}"
        **Analysis Task**: Interpret the user's manual requirements and generate detailed test cases to verify the described functionality. For forms, include example input data.
        """

    elif test_type == 'website':
        return f"""
        {common_instructions}

        **Input Type**: Existing Website URL
        **Website URL**: {{website_url}}
        **Analysis Task**: Analyze the structure, components, and user interaction points of the provided website URL. Generate test cases for key features like navigation, forms, and core functionality. For forms, include example input data.
        """
    else:
        # If the test_type is invalid, return None. This will be handled in the main function.
        return None


def generate_test_cases(test_type, input_data):
    """
    Generates test cases for a specific input type using the LLM.

    This function acts as a dispatcher. It gets the correct prompt template
    for the given test_type, retrieves the LLM, and then calls the LLM utility
    to get the final result.

    Args:
        test_type (str): The type of test to generate.
        input_data (dict): The data needed to fill the prompt template.

    Returns:
        dict or list: The parsed JSON response from the LLM, or an error dictionary.
    """
    
    # 1. Get the prompt template for the specified type.
    prompt_template = _create_prompt_template(test_type)
    
    if not prompt_template:
        return {"error": "Invalid test type", "details": f"The test type '{test_type}' is not supported."}

    # 2. Get the initialized LLM from our utility.
    llm = get_llm()
    if not llm:
        return {"error": "LLM Initialization Failed", "details": "Could not connect to the language model."}

    # 3. Call the generic LLM invoker with the specific prompt and data.
    # The invoke_llm_for_json function will handle the API call and parsing.
    result = invoke_llm_for_json(llm, prompt_template, input_data)
    
    return result
