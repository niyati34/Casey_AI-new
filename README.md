# Casey AI - Automated Test Generation & Runner

A professional, minimalistic web application for automated test generation and execution. Casey AI helps you generate comprehensive test cases from Figma designs, documents, or live websites, and run them with AI-powered precision.

## Features

- **Multi-Source Test Generation**: Generate tests from:

  - Figma file keys
  - Document uploads (PDF, DOC, DOCX)
  - Website URLs

- **Live Test Execution**: Run test cases on live websites with real-time results

- **Professional UI**: Clean, minimalistic interface with white, purple, and black color scheme

- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices

## Getting Started

### Prerequisites

- Python 3.7 or higher
- pip package manager

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd Casey_AI-new
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the application:

```bash
python app.py
```

4. Open your browser and navigate to `http://localhost:5000`

## Usage

### Generate Test Cases

1. Navigate to the "Try API" section
2. Select your input source:

   - **Figma File**: Enter your Figma file key
   - **Document**: Upload a PDF, DOC, or DOCX file
   - **Website URL**: Enter a website URL to analyze

3. Click "Generate Test Cases" to create comprehensive test scenarios

### Run Test Cases

1. Switch to the "Run Test Cases" tab
2. Enter the website URL where tests should be executed
3. Toggle "Enable Live Testing" if you want real-time execution
4. Paste your test cases JSON or use previously generated tests
5. Click "Run Test Cases" to execute and view results

## API Endpoints

### Generate Test Cases

```
POST /api/generate-test
Content-Type: application/json

{
  "test_type": "figma|document|website",
  "figma_key": "string",      // Required for figma type
  "file_content": "string",   // Required for document type
  "file_name": "string",      // Required for document type
  "website_url": "string"     // Required for website type
}
```

### Run Test Cases

```
POST /api/run-test
Content-Type: application/json

{
  "website_url": "string",
  "test_cases": [...],
  "live_testing": boolean
}
```

### File Upload

```
POST /api/upload
Content-Type: multipart/form-data

file: File (PDF, DOC, DOCX - max 16MB)
```

## Project Structure

```
Casey_AI-new/
├── app.py                 # Flask application
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css     # Styling
│   └── js/
│       └── script.js     # JavaScript functionality
└── uploads/              # File upload directory
```

## Technology Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with CSS Variables
- **Icons**: Font Awesome 6
- **Fonts**: Inter (Google Fonts)

## Color Scheme

- **Primary Purple**: #6366f1
- **Purple Light**: #8b5cf6
- **Purple Dark**: #4338ca
- **White**: #ffffff
- **Black**: #000000
- **Gray Scale**: Various shades for text and backgrounds

## Features in Detail

### Responsive Design

- Mobile-first approach
- Breakpoints at 768px and 480px
- Flexible grid layouts
- Touch-friendly interface

### User Experience

- Smooth scrolling navigation
- Loading states and progress indicators
- Toast notifications for user feedback
- Drag & drop file uploads
- Form validation with helpful hints

### Performance

- Optimized CSS with efficient selectors
- Minimal JavaScript footprint
- Lazy loading for better performance
- Compressed assets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
