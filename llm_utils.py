import os
import json
from langchain_google_genai import ChatGoogle_genai
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

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

        # Increased token limit for safety, though the comma-separated format is more efficient.
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=api_key,
            temperature=0.2,
            max_output_tokens=2048
        )
        return llm
    except Exception as e:
        print(f"Error initializing the LLM. Please check your API key and configurations: {e}")
        return None


def invoke_llm_for_json(llm, prompt_template, input_data):
    """
    Invokes the LLM for a comma-separated list and converts it to a JSON array.
    """
    if not llm:
        return {"error": "LLM not initialized", "details": "The language model could not be started."}

    try:
        prompt = ChatPromptTemplate.from_template(prompt_template)
        output_parser = StrOutputParser()
        chain = prompt | llm | output_parser

        # Streaming the response to handle the data efficiently.
        response_str = ""
        for chunk in chain.stream(input_data):
            response_str += chunk

        # --- KEY CHANGE: Convert the comma-separated string to a list ---
        # This is a robust way to ensure we always get a valid list of strings.
        test_cases = [item.strip() for item in response_str.split(',') if item.strip()]

        return test_cases

    except Exception as e:
        print(f"An unexpected error occurred during LLM invocation: {e}")
        return {"error": "An unexpected error occurred", "details": str(e)}