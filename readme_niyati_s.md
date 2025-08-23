# BugzyAI - Automated Test Generation & Runner

Welcome to the BugzyAI project! This is a web application designed to automatically generate and manage test cases for software projects. It uses the power of Google's Gemini AI to create detailed test cases from various sources and provides a user-friendly interface to manage the testing workflow.

## 🚀 Getting Started

Follow these steps to get the project running on your local machine.

### 1. Prerequisites

Make sure you have the following installed:

* Python 3.7+

* pip (Python package installer)

### 2. Installation & Configuration

1. **Clone the repository:**

   ```
   git clone <your-repository-url>
   cd <repository-folder>
   ```

2. **Install the required packages:**

   ```
   pip install -r requirements.txt
   ```

3. **Create your Environment File (`.env`)**
   This is the most important step for connecting to the AI.

   * In the main project folder, create a new file named `.env`.

   * Open the `.env` file and add the following line, replacing `"YOUR_API_KEY_HERE"` with your actual Google Gemini API key:

     ```
     GOOGLE_GEMINI_API="YOUR_API_KEY_HERE"
     ```

   * You can get a Gemini API key from the [Google AI Studio](https://aistudio.google.com/app/apikey).

### 3. Running the Application

Once the setup is complete, start the web server with this command:

```
python app.py
```

Now, open your web browser and go to `http://127.0.0.1:5000` to see the application live.

## 🛠️ How It Works: The Backend Engine

The backend is built with Python and is the core of the application's logic.

### `llm_utils.py` - The AI Communicator

This file is the bridge between our application and the Google Gemini AI.

* **What it does:** Its only job is to handle all communication with the AI model.

* **`get_llm()`:** This function reads your `GOOGLE_GEMINI_API` key from the `.env` file and initializes the `ChatGoogleGenerativeAI` model. Without a valid API key here, the application cannot talk to the AI.

* **`invoke_llm()`:** This function takes a prompt (a set of instructions) and sends it to the initialized AI model. It then waits for the AI to respond and returns the raw text answer. It is used by `test_case_generation.py`.

### `test_case_generation.py` - The AI Prompt Master

This file is responsible for telling the AI *what* to do and *how* to do it.

* **What it does:** It constructs detailed prompts to send to the AI and then parses the AI's response into a structured format.

* **`_create_prompt_template()`:** This is the heart of the AI's instructions. It creates a detailed set of instructions based on the user's input type (Figma, document, etc.). **If you want to change what the AI generates (e.g., ask for more or different details), you should edit the `common_instructions` variable in this function.**

* **`_parse_llm_response()`:** The AI's response is just a string of text. This function acts as a "translator" that carefully reads that string and extracts the test case data, converting it into a clean JSON format that our application can easily use.

* **`generate_test_cases()`:** This is the main function that orchestrates the process. It gets the correct prompt, calls `invoke_llm()` from `llm_utils.py` to talk to the AI, and then uses `_parse_llm_response()` to clean up the result.

### `document_parser.py` - The File Reader

This file handles the "Use Existing Test Cases" flow when you upload a document.

* **What it does:** It efficiently extracts text from uploaded `.docx` and `.pdf` files. This process does **not** use AI, making it very fast and reliable for documents that are already structured. It uses regular expressions (RegEx) to find and extract test cases based on patterns like "ID:", "Description:", etc.

### `app.py` - The Central Controller (API)

This is the main server file that runs the entire application.

* **What it does:** It uses the Flask framework to create a web server and define the API endpoints that the frontend calls.

* **`/` and `/pipeline` routes:** These simply load and display the main HTML pages of the application.

* **`/api/generate-test`:** This is the endpoint that the frontend calls when a user wants to generate new test cases. It receives the user's input, calls the `generate_test_cases` function, and returns the structured list of tests to the frontend.

* **`/api/parse-tests-from-file`:** This endpoint is used for the direct upload flow. It takes the uploaded file, uses `document_parser.py` to extract the tests, and sends them back to the frontend.

* **`/api/download-tests`:** When the user clicks the download button, the frontend sends the list of generated test cases to this endpoint. This function then uses the `python-docx` library to create a `.docx` file on the fly and sends it to the user for download.

## 🎨 How It Works: The Frontend Interface

The frontend is what the user sees and interacts with in their browser.

### `pipeline.html` - The User's View

* **What it does:** This file defines the complete HTML structure of the user interface, including the four-step pipeline, the input forms, and the containers where test cases will be displayed. The most important section for displaying test cases is the `<div id="test-list-display-container"></div>`, which is initially empty.

### `script.js` - The Brains of the Page

* **What it does:** This file contains all the JavaScript code that makes the webpage interactive. It handles user clicks, calls the backend APIs, and dynamically updates the HTML to show new information.

* **`goToStep()`:** This function manages the user's progression through the 4-step pipeline, showing and hiding different sections as needed. It's also responsible for deciding when to display the list of test cases.

* **`generateTestCases()`:** When the "Generate Test Cases" button is clicked, this function gathers the user's input, sends it to the `/api/generate-test` endpoint on the backend, and waits for the response.

* **`displayTestCasesAccordion()`:** Upon a successful response from the backend, this function dynamically creates the HTML for the accordion list of test cases. It's responsible for creating the checkboxes and ensuring that any previously selected tests remain checked if the user navigates back.

* **`toggleTestCaseSelection()`:** This function is triggered every time a user checks or unchecks a test case. It updates the `selectedTestCases` array, which keeps track of which tests will be sent to the next phase for execution.
