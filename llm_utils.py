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
    """
    try:
        api_key = os.getenv("GOOGLE_GEMINI_API")
        if not api_key:
            print("Error: GOOGLE_GEMINI_API key not found in .env file.")
            return None

        # --- THE FIX IS HERE ---
        # We are now explicitly setting a higher token limit for the response.
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=api_key,
            temperature=0.2,
            max_output_tokens=8192  # Increased token limit to allow for longer responses
        )
        return llm
    except Exception as e:
        print(f"Error initializing the LLM. Please check your API key and configurations: {e}")
        return None


def invoke_llm_for_json(llm, prompt_template, input_data):
    """
    Invokes the LLM with a given prompt template and input data, expecting a JSON string in response.
    """
    if not llm:
        return {"error": "LLM not initialized", "details": "The language model could not be started, likely due to a missing API key."}

    try:
        prompt = ChatPromptTemplate.from_template(prompt_template)
        output_parser = StrOutputParser()
        chain = prompt | llm | output_parser

        # Streaming the response to handle large amounts of data without timeouts
        response_str = ""
        for chunk in chain.stream(input_data):
            response_str += chunk

        return json.loads(response_str)

    except json.JSONDecodeError:
        print("Error: Failed to decode JSON from the LLM response.")
        return {"error": "Failed to parse API response", "details": response_str if 'response_str' in locals() else "No valid response."}
    except Exception as e:
        print(f"An unexpected error occurred during LLM invocation: {e}")
        return {"error": "An unexpected error occurred", "details": str(e)}