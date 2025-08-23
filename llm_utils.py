import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def get_llm():
    """
    Returns a dictionary with OpenRouter API key and model name for use in invoke_llm.
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    model = os.getenv("OPENROUTER_MODEL", "gpt-oss-20b")  # Default to gpt-oss-20b
    if not api_key:
        print("Error: OPENROUTER_API_KEY not found in .env file.")
        return None
    return {"api_key": api_key, "model": model}

def invoke_llm(llm, prompt_template, input_data):
    """
    Invokes the OpenRouter LLM with a given prompt template and input data, returning the raw string response.
    Formats placeholders in the template using keys from input_data (e.g. {website_url}).
    """
    if not llm:
        return {"error": "LLM not initialized", "details": "The language model could not be started."}

    # Format the prompt using the template and input_data
    try:
        # Prefer mapping-based formatting: supports {website_url}, {file_name}, etc.
        if isinstance(input_data, dict):
            prompt = prompt_template.format(**input_data)
        else:
            # Fallback: support legacy {input}
            prompt = (
                prompt_template.format(input=input_data)
                if '{input}' in prompt_template else prompt_template
            )
    except Exception as e:
        return {"error": "Prompt formatting failed", "details": str(e)}

    headers = {
        "Authorization": f"Bearer {llm['api_key']}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://openrouter.ai/",  # OpenRouter recommends setting this
        "X-Title": "BugzyAI"
    }
    data = {
        "model": llm["model"],
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            data=json.dumps(data),
            timeout=60
        )
        response.raise_for_status()
        result = response.json()
        # Extract the response text
        return result["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"An unexpected error occurred during LLM invocation: {e}")
        return {"error": "An unexpected error occurred", "details": str(e)}

