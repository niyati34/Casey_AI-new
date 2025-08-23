<div align="center">

# 🤖 BugzyAI 
### *Intelligent Test Generation & Automation Platform*

[![Python](https://img.shields.io/badge/Python-3.7+-blue.svg)](https://www.python.org)
[![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)](https://flask.palletsprojects.com)
[![Selenium](https://img.shields.io/badge/Selenium-4.0+-orange.svg)](https://selenium.dev)
[![Google Gemini AI](https://img.shields.io/badge/Google%20Gemini-AI%20Powered-red.svg)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

*Revolutionizing software testing with AI-powered test case generation and automated execution*

[🚀 Live Demo](https://bugzy-ai.vercel.app) | [💬 Support](#support) | [🤝 Contributing](#contributing)

</div>

---

## ✨ Features

- 🧠 **AI-Powered Test Generation** - Generate comprehensive test cases using Google Gemini AI
- 📋 **Multiple Input Sources** - Support for Figma designs, requirements documents, user stories, and existing test files
- 🎯 **Smart Test Execution** - Automated Selenium-based test execution with intelligent element detection
- 🎨 **Modern UI/UX** - Professional dark-themed interface with glassmorphism design
- 🌐 **Multi-Format Support** - Handle DOCX, PDF files, and various test case formats

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
├── app.py                          # Flask web server & API endpoints
├── core/
│   ├── document_parser.py          # Document processing utilities
│   ├── llm_utils.py                # Google Gemini AI integration
│   ├── test_case_generation.py     # AI prompt engineering & response parsing
│   └── test_executor.py            # Selenium-based test automation
├── data/
│   ├── generated_test_cases.docx   # AI-generated test cases
│   └── test_execution_results.docx # Automation results
├── static/
│   ├── css/
│   │   ├── landing.css             # Homepage styling
│   │   └── style.css               # Pipeline interface styling
│   └── js/
│       ├── landing.js              # Homepage interactions
│       └── script.js               # Pipeline functionality
├── templates/
│   ├── index.html                  # Landing page
│   ├── pipeline.html               # Main testing interface
│   ├── base.html                   # Template inheritance base
│   └── [other-pages]/              # Additional pages
├── requirements.txt                # Python package dependencies
├── vercel.json                     # Deployment configuration
└── venv/                           # Virtual environment
```

## 🔒 Security & Configuration

### Environment Variables
```bash
# Required
GOOGLE_GEMINI_API=your_gemini_api_key
```

### Security Features
- 🔐 **API Key Protection**: Secure environment variable management
- 🛡️ **Input Validation**: Comprehensive request sanitization
- 📝 **File Upload Security**: Type validation and size limits
- 🔒 **CORS Protection**: Cross-origin request security
- 🚫 **XSS Prevention**: Content security policies

## 📞 Support

### 💬 Community Support
- **GitHub Issues**: [Report bugs and request features](https://github.com/dhairyadev26/Bugzy_AI/issues)
- **Discussions**: [Join community conversations](https://github.com/dhairyadev26/Bugzy_AI/discussions)

### 📧 Direct Contact
- **Email**: support@bugzyai.com

---

<div align="center">

### 🌟 Star this repository if BugzyAI helps your testing workflow!

[![GitHub stars](https://img.shields.io/github/stars/dhairyadev26/Bugzy_AI?style=social)](https://github.com/dhairyadev26/Bugzy_AI/stargazers)

**Made by the BugzyAI Team**

[🏠 Homepage](https://bugzy-ai.vercel.app)

</div>
