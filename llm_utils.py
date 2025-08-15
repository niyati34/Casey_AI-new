import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

# --- Configuration ---
# This line loads the environment variables from your .env file
load_dotenv()

def get_llm():
    """
    Initializes and returns the LangChain ChatGoogleGenerativeAI model.

    This function centralizes the model configuration. It now explicitly loads
    the API key from the 'GOOGLE_GEMINI_API' environment variable.

    Returns:
        ChatGoogleGenerativeAI: An instance of the LangChain chat model, or None if the key is missing.
    """
    try:
        # Retrieve the API key from the environment variable
        api_key = os.getenv("GOOGLE_GEMINI_API")
        if not api_key:
            print("Error: GOOGLE_GEMINI_API key not found in .env file.")
            return None

        # --- UPDATED MODEL NAME ---
        # Initialize the model with a current, valid model name.
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key, temperature=0.2)
        return llm
    except Exception as e:
        print(f"Error initializing the LLM. Please check your API key and configurations: {e}")
        return None


def invoke_llm_for_json(llm, prompt_template, input_data):
    """
    Invokes the LLM with a given prompt template and input data, expecting a JSON string in response.

    Args:
        llm (ChatGoogleGenerativeAI): The initialized LangChain model instance.
        prompt_template (str): A string template for the prompt with placeholders.
        input_data (dict): A dictionary containing data to fill the prompt placeholders.

    Returns:
        dict or list: The parsed JSON object from the LLM's response.
                      Returns an error dictionary if parsing fails or an exception occurs.
    """
    if not llm:
        return {"error": "LLM not initialized", "details": "The language model could not be started, likely due to a missing API key."}

    try:
        # Create a prompt using LangChain's template system.
        prompt = ChatPromptTemplate.from_template(prompt_template)

        # Use a simple string output parser, as we expect the LLM to return a raw JSON string.
        output_parser = StrOutputParser()

        # Create the LangChain chain. This links the prompt, model, and parser together.
        chain = prompt | llm | output_parser

        # Invoke the chain with the specific input data for this request.
        response_str = chain.invoke(input_data)

        # Parse the string response into a Python dictionary or list.
        return json.loads(response_str)

    except json.JSONDecodeError:
        print("Error: Failed to decode JSON from the LLM response.")
        return {"error": "Failed to parse API response", "details": response_str if 'response_str' in locals() else "No valid response."}
    except Exception as e:
        print(f"An unexpected error occurred during LLM invocation: {e}")
        return {"error": "An unexpected error occurred", "details": str(e)}
