// Modern Casey AI Pipeline JavaScript
let currentPipelineStep = 1;
let currentInputSource = 'figma';
let generatedTests = [];
let sourceWebsiteUrl = '';
let targetWebsiteUrl = '';

// DOM Elements
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const toastContainer = document.getElementById('toast-container');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializePipeline();
    initializeFileUpload();
    initializeSourceSelection();
    setupScrollEffects();
});

// Navigation
function initializeNavigation() {
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
}

// Pipeline Management
function initializePipeline() {
    // Step clicking
    document.querySelectorAll('.pipeline-step').forEach(step => {
        step.addEventListener('click', function() {
            const stepNumber = parseInt(this.getAttribute('data-step'));
            if (stepNumber <= currentPipelineStep) {
                goToStep(stepNumber);
            }
        });
    });
}

function goToStep(stepNumber) {
    currentPipelineStep = stepNumber;
    
    // Update progress indicator
    document.querySelectorAll('.pipeline-step').forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNum < currentPipelineStep) {
            step.classList.add('completed');
        } else if (stepNum === currentPipelineStep) {
            step.classList.add('active');
        }
    });
    
    // Update content
    document.querySelectorAll('.pipeline-content').forEach((content, index) => {
        content.classList.remove('active');
        if (index + 1 === currentPipelineStep) {
            content.classList.add('active');
        }
    });
    
    // Update step 2 based on previous selections
    if (stepNumber === 2) {
        updateStep2();
    } else if (stepNumber === 3) {
        updateStep3();
    }
}

// Source Selection
function initializeSourceSelection() {
    document.querySelectorAll('.source-card').forEach(card => {
        card.addEventListener('click', function() {
            const source = this.getAttribute('data-source');
            selectInputSource(source);
        });
    });
}

function selectInputSource(source) {
    currentInputSource = source;
    
    // Update source cards
    document.querySelectorAll('.source-card').forEach(card => {
        card.classList.remove('active');
        if (card.getAttribute('data-source') === source) {
            card.classList.add('active');
        }
    });
    
    // Update input forms
    document.querySelectorAll('.input-form').forEach(form => {
        form.classList.remove('active');
        if (form.getAttribute('data-form') === source) {
            form.classList.add('active');
        }
    });
}

// File Upload
function initializeFileUpload() {
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('document-upload');
    
    uploadZone.addEventListener('click', () => fileInput.click());
    
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });
    
    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });
    
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFileSelect(this.files[0]);
        }
    });
}

function handleFileSelect(file) {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
        showToast('Please select a PDF, DOC, or DOCX file.', 'error');
        return;
    }
    
    if (file.size > 16 * 1024 * 1024) {
        showToast('File size must be less than 16MB.', 'error');
        return;
    }
    
    // Update UI
    const uploadContent = document.querySelector('.upload-content');
    uploadContent.innerHTML = `
        <i class="fas fa-file-check"></i>
        <h4>File Selected</h4>
        <p><strong>${file.name}</strong></p>
        <small>Ready for processing</small>
    `;
    
    showToast('File uploaded successfully!', 'success');
}

// Generate Tests
async function generateTests() {
    const btn = document.querySelector('.btn-generate');
    const originalContent = btn.innerHTML;
    
    try {
        // Validate input
        const inputData = validateInput();
        if (!inputData) return;
        
        // Show loading
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Generating...</span>';
        btn.disabled = true;
        showLoading('Analyzing input and generating test cases...');
        
        // Store source website if applicable
        if (currentInputSource === 'website') {
            sourceWebsiteUrl = inputData.website_url;
        }
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Generate mock tests
        generatedTests = generateMockTests(currentInputSource, inputData);
        
        showToast(`Generated ${generatedTests.length} test cases successfully!`, 'success');
        
        // Move to step 2
        setTimeout(() => {
            goToStep(2);
            scrollToSection('pipeline');
        }, 1000);
        
    } catch (error) {
        console.error('Error generating tests:', error);
        showToast('Failed to generate test cases. Please try again.', 'error');
    } finally {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        hideLoading();
    }
}

function validateInput() {
    switch (currentInputSource) {
        case 'figma':
            const figmaKey = document.getElementById('figma-key').value.trim();
            if (!figmaKey) {
                showToast('Please enter a Figma file key.', 'warning');
                return null;
            }
            return { test_type: 'figma', figma_key: figmaKey };
            
        case 'document':
            const fileInput = document.getElementById('document-upload');
            if (!fileInput.files.length) {
                showToast('Please select a document file.', 'warning');
                return null;
            }
            return { 
                test_type: 'document', 
                file_name: fileInput.files[0].name,
                file_content: 'Document content...'
            };
            
        case 'manual':
            const prompt = document.getElementById('manual-prompt').value.trim();
            if (!prompt) {
                showToast('Please describe your testing requirements.', 'warning');
                return null;
            }
            return { test_type: 'manual', prompt: prompt };
            
        case 'website':
            const url = document.getElementById('website-url').value.trim();
            if (!url) {
                showToast('Please enter a website URL.', 'warning');
                return null;
            }
            if (!isValidUrl(url)) {
                showToast('Please enter a valid URL.', 'warning');
                return null;
            }
            return { test_type: 'website', website_url: url };
            
        default:
            return null;
    }
}

function generateMockTests(source, inputData) {
    const testTemplates = {
        figma: [
            { name: 'UI Component Validation', type: 'Visual', description: 'Verify UI components match Figma design specifications' },
            { name: 'Interactive Elements Test', type: 'Interaction', description: 'Test buttons, forms, and interactive elements' },
            { name: 'Responsive Design Test', type: 'Responsive', description: 'Ensure design works across different screen sizes' },
            { name: 'Color and Typography Test', type: 'Visual', description: 'Validate colors, fonts, and spacing match design' }
        ],
        document: [
            { name: 'Requirements Validation', type: 'Functional', description: 'Test implementation against documented requirements' },
            { name: 'User Flow Testing', type: 'User Journey', description: 'Validate complete user workflows' },
            { name: 'Business Logic Test', type: 'Logic', description: 'Test business rules and validation logic' },
            { name: 'Integration Test', type: 'Integration', description: 'Test system integrations and data flow' }
        ],
        manual: [
            { name: 'Custom Scenario Test', type: 'Custom', description: 'Test based on manual requirements' },
            { name: 'Edge Case Testing', type: 'Edge Case', description: 'Test unusual or boundary conditions' },
            { name: 'User Experience Test', type: 'UX', description: 'Validate user experience and usability' }
        ],
        website: [
            { name: 'Page Load Test', type: 'Performance', description: 'Test page loading speed and performance' },
            { name: 'Navigation Test', type: 'Navigation', description: 'Verify all navigation links work correctly' },
            { name: 'Form Validation Test', type: 'Form', description: 'Test form submission and validation' },
            { name: 'Cross-browser Test', type: 'Compatibility', description: 'Test across different browsers' }
        ]
    };
    
    const templates = testTemplates[source] || testTemplates.manual;
    return templates.map((template, index) => ({
        id: index + 1,
        ...template,
        priority: Math.random() > 0.5 ? 'High' : 'Medium',
        estimatedTime: Math.floor(Math.random() * 5) + 1 + ' min'
    }));
}

// Step 2: Website Selection
function updateStep2() {
    const sameWebsiteOption = document.getElementById('same-website-option');
    const detectedWebsite = document.getElementById('detected-website');
    
    if (sourceWebsiteUrl) {
        sameWebsiteOption.style.display = 'flex';
        detectedWebsite.textContent = sourceWebsiteUrl;
    } else {
        sameWebsiteOption.style.display = 'none';
    }
}

function useSameWebsite() {
    targetWebsiteUrl = sourceWebsiteUrl;
    document.querySelector('.btn-continue').disabled = false;
    showToast('Using same website for testing', 'info');
}

function showWebsiteInput() {
    const section = document.getElementById('website-input-section');
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Enable continue button when URL is entered
    const input = document.getElementById('target-website-url');
    input.addEventListener('input', function() {
        if (this.value.trim() && isValidUrl(this.value.trim())) {
            targetWebsiteUrl = this.value.trim();
            document.querySelector('.btn-continue').disabled = false;
        } else {
            document.querySelector('.btn-continue').disabled = true;
        }
    });
}

function continueToExecution() {
    if (!targetWebsiteUrl) {
        showToast('Please select a target website.', 'warning');
        return;
    }
    
    goToStep(3);
    scrollToSection('pipeline');
}

// Step 3: Execution
function updateStep3() {
    document.getElementById('test-count').textContent = `${generatedTests.length} tests ready`;
    document.getElementById('target-summary').textContent = targetWebsiteUrl || 'No website selected';
}

async function executeTests() {
    const btn = document.querySelector('.btn-execute');
    const originalContent = btn.innerHTML;
    
    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Executing...</span>';
        btn.disabled = true;
        showLoading('Running test cases on target website...');
        
        // Simulate test execution
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        const results = generateMockResults();
        displayResults(results);
        
        showToast('Test execution completed!', 'success');
        
    } catch (error) {
        console.error('Error executing tests:', error);
        showToast('Failed to execute tests. Please try again.', 'error');
    } finally {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        hideLoading();
    }
}

function generateMockResults() {
    return generatedTests.map(test => ({
        ...test,
        status: Math.random() > 0.2 ? 'passed' : 'failed',
        duration: Math.floor(Math.random() * 3000) + 500,
        message: Math.random() > 0.2 ? 'Test completed successfully' : 'Assertion failed or element not found'
    }));
}

function displayResults(results) {
    const resultsSection = document.getElementById('results-section');
    const resultsList = document.getElementById('results-list');
    
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
    
    document.getElementById('passed-tests').textContent = passed;
    document.getElementById('failed-tests').textContent = failed;
    document.getElementById('execution-time').textContent = (totalTime / 1000).toFixed(1) + 's';
    
    resultsList.innerHTML = results.map(result => `
        <div class="result-item ${result.status}">
            <div class="result-icon">
                <i class="fas ${result.status === 'passed' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            </div>
            <div class="result-content">
                <h5>${result.name}</h5>
                <p><strong>Type:</strong> ${result.type} | <strong>Duration:</strong> ${result.duration}ms</p>
                <p class="result-message">${result.message}</p>
            </div>
        </div>
    `).join('');
    
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Utility Functions
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const headerHeight = 80;
        const elementPosition = element.offsetTop - headerHeight;
        
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }
}

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
    
    // Auto remove
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
    
    // Click to remove
    toast.addEventListener('click', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
}

// Scroll Effects
function setupScrollEffects() {
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.modern-header');
        if (window.scrollY > 50) {
            header.style.background = 'rgba(15, 23, 42, 0.95)';
        } else {
            header.style.background = 'rgba(15, 23, 42, 0.8)';
        }
    });
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
