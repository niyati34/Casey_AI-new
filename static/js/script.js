// Global variables
let currentPipelineStep = 1;
let selectedGenerationMethod = null;
let generatedTests = [];
let pipelineData = {
    generationMethod: null,
    sourceUrl: null,
    tests: [],
    executionUrl: null,
    results: []
};

// DOM Elements
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const toastContainer = document.getElementById('toast-container');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeFileUpload();
    initializePipeline();
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

// Initialize Pipeline
function initializePipeline() {
    // Generation method selection
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', function() {
            const method = this.getAttribute('data-option');
            selectGenerationMethod(method);
        });
    });

    // Radio button change
    document.querySelectorAll('input[name="generation-method"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                selectGenerationMethod(this.value);
            }
        });
    });

    // Pipeline step navigation
    document.querySelectorAll('.pipeline-step').forEach(step => {
        step.addEventListener('click', function() {
            const stepNumber = parseInt(this.getAttribute('data-step'));
            if (stepNumber <= currentPipelineStep || this.classList.contains('completed')) {
                goToPipelineStep(stepNumber);
            }
        });
    });
}

// Select generation method
function selectGenerationMethod(method) {
    selectedGenerationMethod = method;
    pipelineData.generationMethod = method;
    
    // Update UI
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-option="${method}"]`).classList.add('selected');
    
    // Check corresponding radio button
    document.getElementById(`${method}-option`).checked = true;
    
    // Show corresponding form
    document.querySelectorAll('.input-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(`${method}-form`).classList.add('active');
}

// Pipeline navigation
function goToPipelineStep(step) {
    if (step < 1 || step > 4) return;
    
    currentPipelineStep = step;
    
    // Update pipeline progress
    updatePipelineProgress();
    
    // Show corresponding step content
    document.querySelectorAll('.pipeline-step-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`step-${step}`).classList.add('active');
    
    // Specific step logic
    switch(step) {
        case 2:
            displayGeneratedTestsInReview();
            break;
        case 3:
            prepareTestExecution();
            break;
        case 4:
            // Results are displayed when tests complete
            break;
    }
}

// Update pipeline progress indicator
function updatePipelineProgress() {
    document.querySelectorAll('.pipeline-step').forEach((step, index) => {
        const stepNumber = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNumber === currentPipelineStep) {
            step.classList.add('active');
        } else if (stepNumber < currentPipelineStep) {
            step.classList.add('completed');
        }
    });
    
    // Update connectors
    document.querySelectorAll('.pipeline-connector').forEach((connector, index) => {
        connector.classList.remove('active');
        if (index + 1 < currentPipelineStep) {
            connector.classList.add('active');
        }
    });
}

// Generate tests in pipeline
async function generateTestsInPipeline() {
    const generateBtn = document.querySelector('.btn-generate');
    const originalText = generateBtn.innerHTML;
    
    try {
        // Validate input based on selected method
        const inputData = validatePipelineInput();
        if (!inputData) return;
        
        // Show loading state
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        generateBtn.disabled = true;
        showLoading('Analyzing input and generating test cases...');
        
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
            pipelineData.tests = generatedTests;
            
            // Store source URL if it was a website analysis
            if (inputData.test_type === 'website') {
                pipelineData.sourceUrl = inputData.website_url;
            }
            
            showToast(`Successfully generated ${generatedTests.length} test cases!`, 'success');
            
            // Move to next step
            setTimeout(() => {
                goToPipelineStep(2);
            }, 1000);
            
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

// Validate pipeline input
function validatePipelineInput() {
    if (!selectedGenerationMethod) {
        showToast('Please select a generation method.', 'warning');
        return null;
    }
    
    let inputData = { test_type: selectedGenerationMethod };
    
    switch (selectedGenerationMethod) {
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
            inputData.file_content = 'File content will be processed';
            break;
            
        case 'prompt':
            const prompt = document.getElementById('manual-prompt').value.trim();
            if (!prompt) {
                showToast('Please describe your requirements.', 'warning');
                return null;
            }
            inputData.manual_prompt = prompt;
            break;
            
        case 'website':
            const websiteUrl = document.getElementById('analysis-website-url').value.trim();
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

// Display generated tests in review step
function displayGeneratedTestsInReview() {
    const reviewContainer = document.getElementById('generated-tests-review');
    
    if (generatedTests.length === 0) {
        reviewContainer.innerHTML = '<p style="color: var(--gray-400); text-align: center;">No test cases generated yet.</p>';
        return;
    }
    
    reviewContainer.innerHTML = generatedTests.map(test => `
        <div class="test-item">
            <h5>${test.name}</h5>
            <p><strong>Type:</strong> ${test.type}</p>
            <p><strong>Description:</strong> ${test.description}</p>
            <div class="test-meta">
                ${test.selector ? `<span><strong>Selector:</strong> ${test.selector}</span>` : ''}
                <span><strong>Priority:</strong> ${test.priority || 'Medium'}</span>
            </div>
        </div>
    `).join('');
}

// Proceed to execution step
function proceedToExecution() {
    if (generatedTests.length === 0) {
        showToast('No test cases available for execution.', 'warning');
        return;
    }
    
    goToPipelineStep(3);
}

// Prepare test execution
function prepareTestExecution() {
    // Auto-fill execution URL if we have source URL from website analysis
    if (pipelineData.sourceUrl) {
        document.getElementById('execution-website-url').value = pipelineData.sourceUrl;
    }
    
    // Display tests to execute
    const previewContainer = document.getElementById('execution-tests-preview');
    previewContainer.innerHTML = generatedTests.map(test => `
        <div class="test-item">
            <h5>${test.name}</h5>
            <p>${test.description}</p>
        </div>
    `).join('');
}

// Execute tests in pipeline
async function executeTestsInPipeline() {
    const executeBtn = document.querySelector('.btn-execute');
    const originalText = executeBtn.innerHTML;
    
    try {
        // Validate execution input
        const executionUrl = document.getElementById('execution-website-url').value.trim();
        const liveTestingEnabled = document.getElementById('live-testing-toggle').checked;
        
        if (!executionUrl) {
            showToast('Please enter a target website URL.', 'warning');
            return;
        }
        
        if (!isValidUrl(executionUrl)) {
            showToast('Please enter a valid URL.', 'warning');
            return;
        }
        
        pipelineData.executionUrl = executionUrl;
        
        // Show loading state
        executeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Executing...';
        executeBtn.disabled = true;
        showLoading('Running test cases on target website...');
        
        // Make API call
        const response = await fetch('/api/run-test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                website_url: executionUrl,
                test_cases: generatedTests,
                live_testing: liveTestingEnabled
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            const testResults = result.results || generateMockResults(generatedTests);
            pipelineData.results = testResults;
            
            showToast('Test execution completed successfully!', 'success');
            
            // Move to results step
            setTimeout(() => {
                displayTestResults(testResults);
                goToPipelineStep(4);
            }, 1000);
            
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('Error executing tests:', error);
        showToast('Failed to execute test cases. Please try again.', 'error');
    } finally {
        // Reset button state
        executeBtn.innerHTML = originalText;
        executeBtn.disabled = false;
        hideLoading();
    }
}

// Display test results in pipeline
function displayTestResults(results) {
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const total = results.length;
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    // Update summary cards
    document.getElementById('passed-tests-count').textContent = passed;
    document.getElementById('failed-tests-count').textContent = failed;
    document.getElementById('execution-duration').textContent = `${Math.round(totalDuration / 1000)}s`;
    document.getElementById('success-rate').textContent = `${successRate}%`;
    
    // Display detailed results
    const detailedContainer = document.getElementById('detailed-results');
    detailedContainer.innerHTML = results.map(result => `
        <div class="result-item ${result.status}">
            <h5>
                <i class="fas ${result.status === 'passed' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                ${result.name}
            </h5>
            <p><strong>Status:</strong> ${result.status.toUpperCase()}</p>
            <p><strong>Duration:</strong> ${result.duration}ms</p>
            <p><strong>Message:</strong> ${result.message}</p>
        </div>
    `).join('');
}

// Download results
function downloadResults() {
    if (pipelineData.results.length === 0) {
        showToast('No results to download.', 'warning');
        return;
    }
    
    const reportData = {
        generationMethod: pipelineData.generationMethod,
        sourceUrl: pipelineData.sourceUrl,
        executionUrl: pipelineData.executionUrl,
        tests: pipelineData.tests,
        results: pipelineData.results,
        summary: {
            total: pipelineData.results.length,
            passed: pipelineData.results.filter(r => r.status === 'passed').length,
            failed: pipelineData.results.filter(r => r.status === 'failed').length,
            timestamp: new Date().toISOString()
        }
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `casey-ai-test-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast('Test report downloaded successfully!', 'success');
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
                selector: '.btn-primary',
                priority: 'High'
            },
            {
                id: 2,
                name: 'Form Validation Test',
                description: 'Check that form validation works correctly for required fields',
                type: 'Form Validation',
                selector: 'form input[required]',
                priority: 'High'
            },
            {
                id: 3,
                name: 'Responsive Design Test',
                description: 'Ensure the design is responsive across different screen sizes',
                type: 'Responsive',
                selector: '.responsive-container',
                priority: 'Medium'
            },
            {
                id: 4,
                name: 'Color Contrast Test',
                description: 'Verify that color contrast meets accessibility standards',
                type: 'Accessibility',
                selector: '*',
                priority: 'Medium'
            }
        ],
        document: [
            {
                id: 1,
                name: 'User Registration Flow',
                description: 'Test the complete user registration process as described in requirements',
                type: 'User Flow',
                selector: '.registration-form',
                priority: 'High'
            },
            {
                id: 2,
                name: 'Data Validation Test',
                description: 'Verify that data validation rules match the documented specifications',
                type: 'Data Validation',
                selector: 'input[data-validation]',
                priority: 'High'
            },
            {
                id: 3,
                name: 'API Integration Test',
                description: 'Test API endpoints as documented in the specification',
                type: 'API Testing',
                selector: '.api-endpoint',
                priority: 'High'
            },
            {
                id: 4,
                name: 'Business Rules Test',
                description: 'Validate business logic according to SRS document',
                type: 'Business Logic',
                selector: '.business-logic',
                priority: 'Medium'
            }
        ],
        prompt: [
            {
                id: 1,
                name: 'Custom Feature Test',
                description: 'Test the custom features described in the manual prompt',
                type: 'Custom',
                selector: '.custom-feature',
                priority: 'High'
            },
            {
                id: 2,
                name: 'User Interaction Test',
                description: 'Verify user interactions work as specified',
                type: 'User Interaction',
                selector: '.interactive-element',
                priority: 'High'
            },
            {
                id: 3,
                name: 'Edge Case Test',
                description: 'Test edge cases mentioned in requirements',
                type: 'Edge Case',
                selector: '.edge-case',
                priority: 'Medium'
            }
        ],
        website: [
            {
                id: 1,
                name: 'Navigation Test',
                description: 'Verify that all navigation links work correctly',
                type: 'Navigation',
                selector: 'nav a',
                priority: 'High'
            },
            {
                id: 2,
                name: 'Page Load Test',
                description: 'Check that all pages load within acceptable time limits',
                type: 'Performance',
                selector: 'body',
                priority: 'High'
            },
            {
                id: 3,
                name: 'Contact Form Test',
                description: 'Test contact form submission and validation',
                type: 'Form Testing',
                selector: '.contact-form',
                priority: 'Medium'
            },
            {
                id: 4,
                name: 'Search Functionality Test',
                description: 'Verify search features work as expected',
                type: 'Search',
                selector: '.search-form',
                priority: 'Medium'
            },
            {
                id: 5,
                name: 'Mobile Responsiveness Test',
                description: 'Test website responsiveness on mobile devices',
                type: 'Responsive',
                selector: 'body',
                priority: 'High'
            }
        ]
    };
    
    return mockTests[testType] || [];
}

// Generate mock test results for demonstration
function generateMockResults(testCases) {
    return testCases.map((test, index) => ({
        id: test.id || index + 1,
        name: test.name,
        status: Math.random() > 0.25 ? 'passed' : 'failed', // 75% pass rate
        duration: Math.floor(Math.random() * 5000) + 500, // 500-5500ms
        message: Math.random() > 0.25 ? 'Test completed successfully' : 'Element not found or assertion failed',
        screenshot: Math.random() > 0.5 ? 'screenshot_' + (index + 1) + '.png' : null
    }));
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
