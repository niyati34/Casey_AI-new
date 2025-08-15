from flask import Flask, render_template, request, jsonify, send_file
import os
from docx import Document
import pdfplumber
import json

# Import the new test case generation function
from test_case_generation import generate_test_cases
from llm_utils import get_llm, invoke_llm_for_json

app = Flask(__name__)

# Configure upload folder and a smaller file size limit
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024  # NEW: 2MB max file size

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/pipeline')
def pipeline():
    return render_template('pipeline.html')

@app.route('/api/generate-test', methods=['POST'])
def handle_generate_test():
    """
    API endpoint for generating test cases using the LLM.
    """
    try:
        data = request.get_json()
        test_type = data.get('test_type')
        
        if not test_type:
            return jsonify({'status': 'error', 'message': 'test_type is required'}), 400

        test_cases = generate_test_cases(test_type, data)
        
        if isinstance(test_cases, dict) and 'error' in test_cases:
            return jsonify({'status': 'error', 'message': test_cases['details']}), 500

        return jsonify({
            'status': 'success',
            'message': 'Test cases generated successfully!',
            'tests': test_cases
        })

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# --- REVISED AND MORE ROBUST ENDPOINT ---
@app.route('/api/parse-tests-from-file', methods=['POST'])
def parse_tests_from_file():
    """
    API endpoint for parsing test cases from an uploaded DOCX or PDF file.
    """
    try:
        if 'file' not in request.files:
            return jsonify({'status': 'error', 'message': 'No file part in the request'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'status': 'error', 'message': 'No file selected'}), 400
        
        # Server-side check for file size
        if len(file.read()) > app.config['MAX_CONTENT_LENGTH']:
            return jsonify({'status': 'error', 'message': 'File exceeds the 2MB size limit.'}), 413
        file.seek(0) # Reset file pointer after reading

        file_content = ""
        if file.filename.lower().endswith('.docx'):
            doc = Document(file)
            file_content = "\n".join([para.text for para in doc.paragraphs])
        elif file.filename.lower().endswith('.pdf'):
            with pdfplumber.open(file) as pdf:
                for page in pdf.pages:
                    # Added a check for None return from extract_text
                    text = page.extract_text()
                    if text:
                        file_content += text + "\n"
        else:
            return jsonify({'status': 'error', 'message': 'Unsupported file type. Please use .docx or .pdf'}), 400

        if not file_content.strip():
            return jsonify({'status': 'error', 'message': 'Could not extract any text from the uploaded file'}), 500

        llm = get_llm()
        if not llm:
            return jsonify({'status': 'error', 'message': 'LLM could not be initialized'}), 500

        prompt_template = """
            Please analyze the following text which contains a list of test cases.
            Extract the test cases and convert them into a valid JSON array of objects.
            The final output must be ONLY the JSON array and nothing else. Do not include any text, notes, or formatting outside of this JSON array (e.g., no "```json" wrapper).

            Each object in the array must have the following keys:
            - "id": A unique integer for the test case, starting from 1.
            - "name": A short, descriptive name for the test.
            - "description": A detailed explanation of what the test verifies.
            - "type": The category of the test (e.g., "UI Interaction", "Form Validation", "User Flow").
            - "inputs": An array of objects representing input data. Each object should have a "selector" and a "value". If no inputs are described, make this an empty array.
            - "selector": A suggested CSS selector for the primary element to be tested, if applicable.

            Here is the text from the document:
            ---
            {document_text}
            ---
        """
        
        parsed_tests = invoke_llm_for_json(llm, prompt_template, {"document_text": file_content})

        if isinstance(parsed_tests, dict) and 'error' in parsed_tests:
            error_detail = parsed_tests.get('details', 'Failed to parse tests using LLM.')
            return jsonify({'status': 'error', 'message': f"LLM parsing failed: {error_detail}"}), 500
        
        if not isinstance(parsed_tests, list):
             return jsonify({'status': 'error', 'message': 'The LLM did not return a valid list of test cases.'}), 500

        return jsonify({
            'status': 'success',
            'message': 'Test cases parsed successfully!',
            'tests': parsed_tests
        })

    except Exception as e:
        return jsonify({'status': 'error', 'message': f"An unexpected server error occurred: {str(e)}"}), 500


@app.route('/api/run-test', methods=['POST'])
def run_test():
    """API endpoint for running test cases"""
    try:
        data = request.get_json()
        website_url = data.get('website_url')
        test_cases = data.get('test_cases', [])
        
        # TODO: Implement test execution logic
        return jsonify({
            'status': 'success',
            'message': f'Tests executed on website: {website_url}',
            'results': [] # Placeholder for actual test results
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """API endpoint for file uploads for the generation flow"""
    try:
        if 'file' not in request.files:
            return jsonify({'status': 'error', 'message': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'status': 'error', 'message': 'No file selected'}), 400
        
        if file:
            filename = file.filename
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            return jsonify({
                'status': 'success',
                'message': 'File uploaded successfully',
                'filename': filename
            })
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/download-tests', methods=['POST'])
def download_tests():
    """
    API endpoint for generating and downloading a DOCX of test cases.
    """
    try:
        data = request.get_json()
        test_cases = data.get('test_cases', [])

        if not test_cases:
            return jsonify({'status': 'error', 'message': 'No test cases provided'}), 400

        document = Document()
        document.add_heading('Generated Test Cases', 0)
        
        for test in test_cases:
            document.add_heading(f"ID: {test.get('id', 'N/A')} - {test.get('name', 'No Name')}", level=1)
            document.add_paragraph(f"Description: {test.get('description', 'No Description')}")
            document.add_paragraph(f"Type: {test.get('type', 'N/A')}")
            document.add_paragraph(f"Selector: {test.get('selector', 'N/A')}")
            document.add_paragraph() 
        
        doc_output_path = "generated_test_cases.docx"
        document.save(doc_output_path)
        
        return send_file(doc_output_path, as_attachment=True)

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
