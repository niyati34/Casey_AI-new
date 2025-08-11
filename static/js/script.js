// Global variables
let currentTabInput = 'figma';
let generatedTests = [];

// DOM Elements
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const toastContainer = document.getElementById('toast-container');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeFileUpload();
    initializeTabs();
    initializeInputTabs();
});

// Event Listeners
function initializeEventListeners() {
    // Smooth scrolling for navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Window scroll event for header
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
        }
    });
}

// Tab functionality
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Update button states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update content states
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');
                }
            });
        });
    });
}

// Input tab functionality
function initializeInputTabs() {
    const inputTabs = document.querySelectorAll('.input-tab');
    const inputSections = document.querySelectorAll('.input-section');

    inputTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetInput = this.getAttribute('data-input');
            currentTabInput = targetInput;
            
            // Update tab states
            inputTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update section states
            inputSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetInput + '-input') {
                    section.classList.add('active');
                }
            });
        });
    });
}

// File upload functionality
function initializeFileUpload() {
    const fileUploadArea = document.getElementById('file-upload-area');
    const fileInput = document.getElementById('document-upload');

    // Click to upload
    fileUploadArea.addEventListener('click', function() {
        fileInput.click();
    });

    // Drag and drop
    fileUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });

    fileUploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });

    fileUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    // File input change
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFileSelect(this.files[0]);
        }
    });
}

// Handle file selection
function handleFileSelect(file) {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
        showToast('Please select a PDF, DOC, or DOCX file.', 'error');
        return;
    }
    
    if (file.size > 16 * 1024 * 1024) { // 16MB
        showToast('File size must be less than 16MB.', 'error');
        return;
    }
    
    // Update UI to show selected file
    const uploadContent = document.querySelector('#document-input .upload-content');
    uploadContent.innerHTML = `
        <i class="fas fa-file-check"></i>
        <p><strong>${file.name}</strong></p>
        <small>File selected successfully</small>
    `;
    
    showToast('File uploaded successfully!', 'success');
}

// Smooth scrolling function
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const headerHeight = 70;
        const elementPosition = element.offsetTop - headerHeight;
        
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }
}

// Generate test cases
async function generateTests() {
    const generateBtn = document.querySelector('.btn-generate');
    const originalText = generateBtn.innerHTML;
    
    try {
        // Validate input based on current tab
        const inputData = validateAndGetInputData();
        if (!inputData) return;
        
        // Show loading state
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        generateBtn.disabled = true;
        showLoading('Generating test cases...');
        
        // Make API call
        const response = await fetch('/api/generate-test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(inputData)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            generatedTests = result.tests || generateMockTests(inputData.test_type);
            displayGeneratedTests(generatedTests);
            showToast(result.message, 'success');
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('Error generating tests:', error);
        showToast('Failed to generate test cases. Please try again.', 'error');
    } finally {
        // Reset button state
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
        hideLoading();
    }
}

// Validate input data based on current tab
function validateAndGetInputData() {
    let inputData = { test_type: currentTabInput };
    
    switch (currentTabInput) {
        case 'figma':
            const figmaKey = document.getElementById('figma-key').value.trim();
            if (!figmaKey) {
                showToast('Please enter a Figma file key.', 'warning');
                return null;
            }
            inputData.figma_key = figmaKey;
            break;
            
        case 'document':
            const fileInput = document.getElementById('document-upload');
            if (!fileInput.files.length) {
                showToast('Please select a document file.', 'warning');
                return null;
            }
            inputData.file_name = fileInput.files[0].name;
            inputData.file_content = 'File content will be processed'; // Placeholder
            break;
            
        case 'website':
            const websiteUrl = document.getElementById('website-url').value.trim();
            if (!websiteUrl) {
                showToast('Please enter a website URL.', 'warning');
                return null;
            }
            if (!isValidUrl(websiteUrl)) {
                showToast('Please enter a valid URL.', 'warning');
                return null;
            }
            inputData.website_url = websiteUrl;
            break;
    }
    
    return inputData;
}

// Generate mock test cases for demonstration
function generateMockTests(testType) {
    const mockTests = {
        figma: [
            {
                id: 1,
                name: 'Button Click Test',
                description: 'Verify that the primary button is clickable and triggers the expected action',
                type: 'UI Interaction',
                selector: '.btn-primary'
            },
            {
                id: 2,
                name: 'Form Validation Test',
                description: 'Check that form validation works correctly for required fields',
                type: 'Form Validation',
                selector: 'form input[required]'
            },
            {
                id: 3,
                name: 'Responsive Design Test',
                description: 'Ensure the design is responsive across different screen sizes',
                type: 'Responsive',
                selector: '.responsive-container'
            }
        ],
        document: [
            {
                id: 1,
                name: 'User Registration Flow',
                description: 'Test the complete user registration process as described in requirements',
                type: 'User Flow',
                selector: '.registration-form'
            },
            {
                id: 2,
                name: 'Data Validation Test',
                description: 'Verify that data validation rules match the documented specifications',
                type: 'Data Validation',
                selector: 'input[data-validation]'
            },
            {
                id: 3,
                name: 'API Integration Test',
                description: 'Test API endpoints as documented in the specification',
                type: 'API Testing',
                selector: '.api-endpoint'
            }
        ],
        website: [
            {
                id: 1,
                name: 'Navigation Test',
                description: 'Verify that all navigation links work correctly',
                type: 'Navigation',
                selector: 'nav a'
            },
            {
                id: 2,
                name: 'Page Load Test',
                description: 'Check that all pages load within acceptable time limits',
                type: 'Performance',
                selector: 'body'
            },
            {
                id: 3,
                name: 'Contact Form Test',
                description: 'Test contact form submission and validation',
                type: 'Form Testing',
                selector: '.contact-form'
            }
        ]
    };
    
    return mockTests[testType] || [];
}

// Display generated test cases
function displayGeneratedTests(tests) {
    const resultsSection = document.getElementById('generate-results');
    const testCasesList = document.getElementById('test-cases-list');
    
    if (tests.length === 0) {
        testCasesList.innerHTML = '<p class="text-center text-gray-500">No test cases generated.</p>';
    } else {
        testCasesList.innerHTML = tests.map(test => `
            <div class="test-case">
                <h5>${test.name}</h5>
                <p><strong>Type:</strong> ${test.type}</p>
                <p><strong>Description:</strong> ${test.description}</p>
                ${test.selector ? `<p><strong>Selector:</strong> <code>${test.selector}</code></p>` : ''}
            </div>
        `).join('');
    }
    
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Run test cases
async function runTests() {
    const runBtn = document.querySelector('.btn-run');
    const originalText = runBtn.innerHTML;
    
    try {
        // Validate input
        const websiteUrl = document.getElementById('test-website-url').value.trim();
        const testCasesInput = document.getElementById('test-cases-input').value.trim();
        const liveTestingEnabled = document.getElementById('live-testing-toggle').checked;
        
        if (!websiteUrl) {
            showToast('Please enter a website URL.', 'warning');
            return;
        }
        
        if (!isValidUrl(websiteUrl)) {
            showToast('Please enter a valid URL.', 'warning');
            return;
        }
        
        let testCases = [];
        if (testCasesInput) {
            try {
                testCases = JSON.parse(testCasesInput);
            } catch (e) {
                showToast('Invalid JSON format for test cases.', 'error');
                return;
            }
        } else {
            testCases = generatedTests;
        }
        
        if (testCases.length === 0) {
            showToast('No test cases to run. Please generate or input test cases first.', 'warning');
            return;
        }
        
        // Show loading state
        runBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running Tests...';
        runBtn.disabled = true;
        showLoading('Running test cases...');
        
        // Make API call
        const response = await fetch('/api/run-test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                website_url: websiteUrl,
                test_cases: testCases,
                live_testing: liveTestingEnabled
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            const testResults = result.results || generateMockResults(testCases);
            displayTestResults(testResults);
            showToast(result.message, 'success');
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('Error running tests:', error);
        showToast('Failed to run test cases. Please try again.', 'error');
    } finally {
        // Reset button state
        runBtn.innerHTML = originalText;
        runBtn.disabled = false;
        hideLoading();
    }
}

// Generate mock test results for demonstration
function generateMockResults(testCases) {
    return testCases.map((test, index) => ({
        id: test.id || index + 1,
        name: test.name,
        status: Math.random() > 0.3 ? 'passed' : 'failed',
        duration: Math.floor(Math.random() * 5000) + 500, // 500-5500ms
        message: Math.random() > 0.3 ? 'Test completed successfully' : 'Element not found or assertion failed'
    }));
}

// Display test results
function displayTestResults(results) {
    const resultsSection = document.getElementById('run-results');
    const testResultsList = document.getElementById('test-results-list');
    const passedCount = document.getElementById('passed-count');
    const failedCount = document.getElementById('failed-count');
    
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    
    passedCount.textContent = passed;
    failedCount.textContent = failed;
    
    testResultsList.innerHTML = results.map(result => `
        <div class="test-result ${result.status}">
            <h5>
                <i class="fas ${result.status === 'passed' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                ${result.name}
            </h5>
            <p><strong>Status:</strong> ${result.status.toUpperCase()}</p>
            <p><strong>Duration:</strong> ${result.duration}ms</p>
            <p><strong>Message:</strong> ${result.message}</p>
        </div>
    `).join('');
    
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Switch to run tab with generated tests
function switchToRunTab() {
    // Switch to run tab
    document.querySelector('.tab-btn[data-tab="run"]').click();
    
    // Pre-fill test cases if available
    if (generatedTests.length > 0) {
        document.getElementById('test-cases-input').value = JSON.stringify(generatedTests, null, 2);
    }
    
    // Scroll to the run section
    setTimeout(() => {
        document.getElementById('run').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// Download test cases
function downloadTests() {
    if (generatedTests.length === 0) {
        showToast('No test cases to download.', 'warning');
        return;
    }
    
    const dataStr = JSON.stringify(generatedTests, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'casey-ai-test-cases.json';
    link.click();
    URL.revokeObjectURL(url);
    
    showToast('Test cases downloaded successfully!', 'success');
}

// Utility Functions
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function showLoading(message = 'Loading...') {
    loadingText.textContent = message;
    loadingOverlay.classList.add('show');
}

function hideLoading() {
    loadingOverlay.classList.remove('show');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    const titleMap = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Info'
    };
    
    toast.innerHTML = `
        <div class="toast-header">
            <i class="${iconMap[type]}"></i>
            ${titleMap[type]}
        </div>
        <div class="toast-body">${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
    
    // Remove on click
    toast.addEventListener('click', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
}
