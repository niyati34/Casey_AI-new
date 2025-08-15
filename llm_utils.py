import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

# Load environment variables from .env file
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

        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=api_key,
            temperature=0.2,
            max_output_tokens=8192  # Increased token limit
        )
        return llm
    except Exception as e:
        print(f"Error initializing the LLM: {e}")
        return None


def invoke_llm(llm, prompt_template, input_data):
    """
    Invokes the LLM with a given prompt template and input data, returning the raw string response.
    """
    if not llm:
        return {"error": "LLM not initialized", "details": "The language model could not be started."}

    try:
        prompt = ChatPromptTemplate.from_template(prompt_template)
        output_parser = StrOutputParser()
        chain = prompt | llm | output_parser

        # Stream the response to handle potentially large outputs
        response_str = ""
        for chunk in chain.stream(input_data):
            response_str += chunk

        return response_str

    except Exception as e:
        print(f"An unexpected error occurred during LLM invocation: {e}")
        return {"error": "An unexpected error occurred", "details": str(e)}

