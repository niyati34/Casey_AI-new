from flask import Flask, render_template, request, jsonify, send_file
import os
from docx import Document

# Import the new test case generation function
from test_case_generation import generate_test_cases

app = Flask(__name__)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

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

        # --- UPDATED LOGIC ---
        # Call the primary function from your test generation module
        # This replaces the old if/elif block
        test_cases = generate_test_cases(test_type, data)
        
        # Check for errors returned from the generation logic
        if isinstance(test_cases, dict) and 'error' in test_cases:
            # If the LLM utility returned an error, send it back to the client
            return jsonify({'status': 'error', 'message': test_cases['details']}), 500

        return jsonify({
            'status': 'success',
            'message': 'Test cases generated successfully!',
            'tests': test_cases
        })

    except Exception as e:
        # General error handler for unexpected issues
        return jsonify({'status': 'error', 'message': str(e)}), 500

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
    """API endpoint for file uploads"""
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
            
            # For now, we just confirm the upload.
            # A more advanced implementation would read the file content here
            # and pass it to the generate_test_cases function.
            return jsonify({
                'status': 'success',
                'message': 'File uploaded successfully',
                'filename': filename
            })
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# --- UPDATED ENDPOINT ---
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

        # Create a DOCX document
        document = Document()
        document.add_heading('Generated Test Cases', 0)
        
        for test in test_cases:
            document.add_heading(f"ID: {test.get('id', 'N/A')} - {test.get('name', 'No Name')}", level=1)
            document.add_paragraph(f"Description: {test.get('description', 'No Description')}")
            document.add_paragraph(f"Type: {test.get('type', 'N/A')}")
            document.add_paragraph(f"Selector: {test.get('selector', 'N/A')}")
            document.add_paragraph() # Add a little space between test cases
        
        # Save the DOCX to a temporary file
        doc_output_path = "generated_test_cases.docx"
        document.save(doc_output_path)
        
        # Send the file to the client for download
        return send_file(doc_output_path, as_attachment=True)

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
