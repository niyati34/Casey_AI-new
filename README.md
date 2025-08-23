<div align="center">

# 🤖 BugzyAI 
### *Intelligent Test Generation & Automation Platform*

[![Python](https://img.shields.io/badge/Python-3.7+-blue.svg)](https://www.python.org)
[![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)](https://flask.palletsprojects.com)
[![Selenium](https://img.shields.io/badge/Selenium-4.0+-orange.svg)](https://selenium.dev)
[![Google Gemini AI](https://img.shields.io/badge/Google%20Gemini-AI%20Powered-red.svg)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

*Revolutionizing software testing with AI-powered test case generation and automated execution*

[🚀 Live Demo](https://your-demo-url.com) | [📖 Documentation](#documentation) | [💬 Support](#support) | [🤝 Contributing](#contributing)

</div>

---

## ✨ Features

- 🧠 **AI-Powered Test Generation** - Generate comprehensive test cases using Google Gemini AI
- 📋 **Multiple Input Sources** - Support for Figma designs, requirements documents, user stories, and existing test files
- 🎯 **Smart Test Execution** - Automated Selenium-based test execution with intelligent element detection
- 🎨 **Modern UI/UX** - Professional dark-themed interface with glassmorphism design
- � **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- 📊 **Comprehensive Reporting** - Detailed test execution results with downloadable reports
- 🔒 **Secure & Scalable** - Enterprise-ready architecture with security best practices
- 🌐 **Multi-Format Support** - Handle DOCX, PDF files and various test case formats

## 🚀 Quick Start

### Prerequisites

- **Python 3.7+** with pip
- **Google Gemini API Key** ([Get yours here](https://aistudio.google.com/app/apikey))
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dhairyadev26/Bugzy_AI.git
   cd Bugzy_AI
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   # Create .env file
   echo "GOOGLE_GEMINI_API=your_api_key_here" > .env
   
   # Optional Selenium configuration
   echo "SELENIUM_HEADLESS=1" >> .env
   echo "SELENIUM_WAIT_TIMEOUT=15" >> .env
   ```

4. **Launch the application**
   ```bash
   python app.py
   ```

5. **Access the platform**
   - Open your browser to `http://localhost:5000`
   - Start generating intelligent test cases! 🎉

## 🏗️ Architecture & Project Structure

```
BugzyAI/
├── 🎯 Core Application
│   ├── app.py                          # Flask web server & API endpoints
│   ├── llm_utils.py                    # Google Gemini AI integration
│   ├── test_case_generation.py         # AI prompt engineering & response parsing
│   ├── test_executor.py                # Selenium-based test automation
│   └── document_parser.py              # Document processing utilities
│
├── 🎨 Frontend Assets
│   ├── static/
│   │   ├── css/
│   │   │   ├── landing.css             # Homepage styling
│   │   │   └── style.css               # Pipeline interface styling
│   │   └── js/
│   │       ├── landing.js              # Homepage interactions
│   │       └── script.js               # Pipeline functionality
│   │
│   └── templates/
│       ├── index.html                  # Landing page
│       ├── pipeline.html               # Main testing interface
│       ├── base.html                   # Template inheritance base
│       └── [demo-pages]/               # Feature demonstration pages
│           ├── about.html              # Company information
│           ├── pricing.html            # Pricing plans
│           ├── security.html           # Security features
│           ├── integrations.html       # Third-party integrations
│           ├── support.html            # Help & documentation
│           ├── blog.html               # Latest updates
│           ├── careers.html            # Job opportunities
│           ├── compliance.html         # Regulatory compliance
│           ├── privacy.html            # Privacy policy
│           ├── terms.html              # Terms of service
│           └── cookies.html            # Cookie policy
│
├── � Configuration & Dependencies
│   ├── requirements.txt                # Python package dependencies
│   ├── .env                           # Environment variables (API keys)
│   ├── vercel.json                    # Deployment configuration
│   └── uploads/                       # User file uploads directory
│
└── 📊 Generated Outputs
    ├── generated_test_cases.docx       # AI-generated test cases
    └── test_execution_results.docx     # Automation results
```

## 🔧 Core Components

### 🧠 AI Engine (`llm_utils.py`)
**The brain of BugzyAI** - Handles all AI interactions
- **`get_llm()`**: Initializes Google Gemini AI with API authentication
- **`invoke_llm()`**: Sends prompts to AI and processes responses
- **Error handling**: Robust exception management for API failures

### 🎨 Test Generation (`test_case_generation.py`)
**The creative workshop** - Transforms ideas into structured test cases
- **`generate_test_cases()`**: Main orchestration function
- **`_create_prompt_template()`**: Intelligent prompt engineering for different input types
- **`_parse_llm_response()`**: Converts AI responses into structured JSON
- **Multi-format support**: Figma designs, user stories, requirements docs

### 🤖 Test Execution (`test_executor.py`)
**The automation powerhouse** - Brings test cases to life
- **Selenium WebDriver**: Automated browser interactions
- **Smart element detection**: CSS selectors, XPath, and text-based finding
- **Action interpretation**: Intelligent mapping from descriptions to actions
- **Result reporting**: Comprehensive pass/fail documentation

### 📄 Document Processing (`document_parser.py`)
**The file whisperer** - Extracts intelligence from documents
- **Multi-format support**: DOCX, PDF processing
- **Pattern recognition**: RegEx-based test case extraction
- **Content validation**: Ensures data integrity and completeness

### 🌐 Web Server (`app.py`)
**The central command** - Orchestrates the entire platform
```python
# Core API Endpoints
@app.route('/api/generate-test')      # AI test generation
@app.route('/api/parse-tests-from-file') # Document parsing
@app.route('/api/run-test')           # Test execution
@app.route('/api/download-tests')     # Results export
@app.route('/api/download-results')   # Execution reports
```

## 🎯 User Journey & Features

### 1. 🏠 **Landing Experience**
- **Modern Design**: Dark theme with glassmorphism effects
- **Feature Showcase**: Interactive demonstrations of capabilities
- **Getting Started**: Smooth onboarding process

### 2. 🔄 **Test Generation Pipeline**
**Step 1: Input Source Selection**
- 🎨 Figma Design Analysis
- 📝 Requirements Document Processing
- 📋 User Story Conversion
- 📄 Existing Test Case Import

**Step 2: AI-Powered Generation**
- Intelligent prompt crafting based on input type
- Context-aware test case creation
- Multiple test categories (UI, Functional, API, Performance)

**Step 3: Review & Customization**
- Interactive test case review interface
- Selective test case management
- Real-time editing capabilities

**Step 4: Execution & Reporting**
- Automated Selenium-based testing
- Real-time execution monitoring
- Comprehensive result documentation

### 3. 📊 **Advanced Features**
- **Batch Processing**: Handle multiple test suites simultaneously
- **Cross-browser Testing**: Support for Chrome, Firefox, Safari
- **Mobile Testing**: Responsive design validation
- **API Testing**: RESTful service validation
- **Performance Monitoring**: Load time and resource analysis

## 🔒 Security & Configuration

### Environment Variables
```bash
# Required
GOOGLE_GEMINI_API=your_gemini_api_key

# Optional Selenium Configuration
SELENIUM_HEADLESS=1                    # 0 for visible browser
SELENIUM_WAIT_TIMEOUT=15               # Element wait time (seconds)
SELENIUM_PAGELOAD_TIMEOUT=30           # Page load timeout (seconds)
SELENIUM_WINDOW_SIZE=1366,900          # Browser window dimensions
```

### Security Features
- 🔐 **API Key Protection**: Secure environment variable management
- 🛡️ **Input Validation**: Comprehensive request sanitization
- 📝 **File Upload Security**: Type validation and size limits
- 🔒 **CORS Protection**: Cross-origin request security
- 🚫 **XSS Prevention**: Content security policies

## 📱 Responsive Design System

### Desktop Experience
- **Large Screens**: Full-featured interface with side panels
- **Navigation**: Comprehensive menu system with quick access
- **Workspace**: Multi-column layouts for productivity

### Tablet Experience
- **Medium Screens**: Adaptive layouts with collapsible sections
- **Touch Optimization**: Finger-friendly interactive elements
- **Orientation Support**: Portrait and landscape modes

### Mobile Experience
- **Small Screens**: Streamlined interface with essential features
- **Progressive Disclosure**: Step-by-step guided workflows
- **Thumb Navigation**: Bottom-aligned action buttons

## 🔧 API Documentation

### Generate Test Cases
```http
POST /api/generate-test
Content-Type: application/json

{
    "test_type": "figma|requirements|user_story|existing_tests",
    "content": "Input content based on type",
    "options": {
        "test_categories": ["ui", "functional", "api"],
        "complexity": "basic|intermediate|advanced"
    }
}
```

### Execute Tests
```http
POST /api/run-test
Content-Type: application/json

{
    "website_url": "https://example.com",
    "test_cases": [
        {
            "id": 1,
            "name": "Login Test",
            "description": "Click login button and verify redirect",
            "type": "ui",
            "selector": "#login-btn"
        }
    ]
}
```

### Download Results
```http
GET /api/download-results
Query Parameters:
- format: docx|pdf|json|csv
- include_screenshots: true|false
```

## 🚀 Advanced Usage

### Custom Test Generation Prompts
```python
# Modify test_case_generation.py to customize AI behavior
common_instructions = """
Generate comprehensive test cases that include:
- Detailed step-by-step instructions
- Expected results and acceptance criteria
- Edge cases and error scenarios
- Performance and accessibility considerations
"""
```

### Selenium Configuration
```python
# Advanced WebDriver setup in test_executor.py
options = webdriver.ChromeOptions()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--disable-gpu')
```

### Custom Element Selectors
```javascript
// Extend script.js for custom element detection
const customSelectors = {
    'login': ['#login', '.login-btn', '[data-testid="login"]'],
    'submit': ['#submit', '.submit-btn', 'button[type="submit"]'],
    'search': ['#search', '.search-input', '[placeholder*="search"]']
};
```

## 🛠️ Development Guide

### Setting Up Development Environment
```bash
# Clone and setup
git clone https://github.com/dhairyadev26/Bugzy_AI.git
cd Bugzy_AI

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install development dependencies
pip install -r requirements.txt
pip install pytest flask-testing selenium-wire

# Setup pre-commit hooks
pip install pre-commit
pre-commit install
```

### Running Tests
```bash
# Run unit tests
python -m pytest tests/

# Run with coverage
python -m pytest --cov=. tests/

# Run integration tests
python -m pytest tests/integration/

# Run Selenium tests (requires browser)
python -m pytest tests/selenium/ --browser=chrome
```

### Code Quality
```bash
# Format code
black .
isort .

# Lint code
flake8 .
pylint *.py

# Type checking
mypy .
```

## 🔄 Deployment

### Local Development
```bash
# Development server with hot reload
export FLASK_ENV=development
export FLASK_DEBUG=1
python app.py
```

### Production Deployment (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Docker Deployment
```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["python", "app.py"]
```

```bash
# Build and run
docker build -t bugzyai .
docker run -p 5000:5000 --env-file .env bugzyai
```

### Environment-Specific Configuration
```bash
# Production environment
export FLASK_ENV=production
export GOOGLE_GEMINI_API=prod_api_key
export SELENIUM_HEADLESS=1

# Staging environment
export FLASK_ENV=staging
export GOOGLE_GEMINI_API=staging_api_key
export SELENIUM_HEADLESS=0
```

## 📊 Monitoring & Analytics

### Performance Metrics
- **Response Time**: API endpoint performance tracking
- **Success Rate**: Test generation and execution success rates
- **Resource Usage**: Memory and CPU utilization monitoring
- **User Engagement**: Feature usage analytics

### Logging Configuration
```python
import logging
from logging.handlers import RotatingFileHandler

# Setup structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s %(message)s',
    handlers=[
        RotatingFileHandler('bugzyai.log', maxBytes=10485760, backupCount=5),
        logging.StreamHandler()
    ]
)
```

## 🐛 Troubleshooting

### Common Issues

**1. API Key Authentication Errors**
```bash
# Check .env file exists and contains valid API key
cat .env
# Verify API key format
echo $GOOGLE_GEMINI_API
```

**2. Selenium WebDriver Issues**
```bash
# Update Chrome browser
google-chrome --version

# Clear browser cache
rm -rf ~/.cache/google-chrome/

# Check selenium version
pip show selenium
```

**3. File Upload Problems**
```bash
# Check upload directory permissions
ls -la uploads/
chmod 755 uploads/

# Verify file size limits
du -h uploads/*
```

**4. Port Already in Use**
```bash
# Find process using port 5000
lsof -i :5000
netstat -tulpn | grep 5000

# Kill process
kill -9 <PID>
```

### Debug Mode
```python
# Enable detailed error messages
app.debug = True
app.config['TESTING'] = True

# Add debug logging
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### 1. Fork & Clone
```bash
git clone https://github.com/YOUR_USERNAME/Bugzy_AI.git
cd Bugzy_AI
```

### 2. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Development Guidelines
- **Code Style**: Follow PEP 8 for Python, use Black formatter
- **Testing**: Add tests for new features
- **Documentation**: Update README and inline comments
- **Commits**: Use conventional commit format

### 4. Pull Request Process
- Ensure all tests pass
- Update documentation
- Add screenshots for UI changes
- Request review from maintainers

### Contributing Areas
- 🐛 **Bug Fixes**: Help identify and fix issues
- ✨ **New Features**: Add new testing capabilities
- 📚 **Documentation**: Improve guides and examples
- 🎨 **UI/UX**: Enhance user interface and experience
- 🔧 **Performance**: Optimize speed and efficiency
- 🌐 **Localization**: Add multi-language support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** - Powering intelligent test generation
- **Selenium** - Enabling automated browser testing
- **Flask** - Providing the web framework foundation
- **Contributors** - Thank you to all who help improve BugzyAI

## 📞 Support

### 💬 Community Support
- **GitHub Issues**: [Report bugs and request features](https://github.com/dhairyadev26/Bugzy_AI/issues)
- **Discussions**: [Join community conversations](https://github.com/dhairyadev26/Bugzy_AI/discussions)
- **Wiki**: [Browse documentation and guides](https://github.com/dhairyadev26/Bugzy_AI/wiki)

### 📧 Direct Contact
- **Email**: support@bugzyai.com
- **Twitter**: [@BugzyAI](https://twitter.com/BugzyAI)
- **LinkedIn**: [BugzyAI](https://linkedin.com/company/bugzyai)

### 🆘 Emergency Support
For critical issues in production environments:
- **Priority Support**: enterprise@bugzyai.com
- **Phone**: +1-XXX-XXX-XXXX (Business hours: 9 AM - 6 PM EST)

---

<div align="center">

### 🌟 Star this repository if BugzyAI helps your testing workflow!

[![GitHub stars](https://img.shields.io/github/stars/dhairyadev26/Bugzy_AI?style=social)](https://github.com/dhairyadev26/Bugzy_AI/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/dhairyadev26/Bugzy_AI?style=social)](https://github.com/dhairyadev26/Bugzy_AI/network/members)

**Made by the BugzyAI Team**

[🏠 Homepage](https://bugzyai.com) | [📖 Documentation](https://docs.bugzyai.com) | [🚀 Live Demo](https://demo.bugzyai.com)

</div>
