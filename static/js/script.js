// Global variables
let currentTabInput = "figma";
let generatedTests = [];
let selectedTestCases = []; // To store test cases selected for live testing
let currentStep = 1;
let sourceWebsiteUrl = "";
let selectedInputType = "";
let isDirectTestingMode = false; // NEW: To track the user's chosen flow

// DOM Elements
const loadingOverlay = document.getElementById("loading-overlay");
const loadingText = document.getElementById("loading-text");
const toastContainer = document.getElementById("toast-container");

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeEventListeners();
  initializePipelineChoice(); // NEW: Initialize the new choice buttons
});

// Event Listeners
function initializeEventListeners() {
  // Smooth scrolling for navigation
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href").substring(1);
      scrollToSection(targetId);

      // Update active nav link
      document
        .querySelectorAll(".nav-link")
        .forEach((l) => l.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // Window scroll event for header
  window.addEventListener("scroll", function () {
    const header = document.querySelector(".header");
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
}

// NEW: Handle the initial choice between generating tests and direct testing
function initializePipelineChoice() {
    const generateBtn = document.getElementById("generate-new-btn");
    const liveTestBtn = document.getElementById("live-testing-btn");
    const choiceContainer = document.getElementById("pipeline-choice");
    const progressContainer = document.getElementById("pipeline-progress-container");
    const mainContainer = document.getElementById("pipeline-main-container");

    generateBtn.addEventListener("click", () => {
        isDirectTestingMode = false;
        choiceContainer.style.display = "none";
        progressContainer.style.display = "flex";
        mainContainer.style.display = "block";
        initializeGenerationFlow();
    });

    liveTestBtn.addEventListener("click", () => {
        isDirectTestingMode = true;
        choiceContainer.style.display = "none";
        // Hide progress bar for direct testing flow as it's not relevant
        progressContainer.style.display = "none"; 
        mainContainer.style.display = "block";
        initializeDirectTestingFlow();
    });
}

// NEW: Setup for the test generation flow
function initializeGenerationFlow() {
    initializeFileUpload();
    initializePipeline();
    initializeWebsiteOptions();
    goToStep(1); // Start at step 1
}

// NEW: Setup for the direct live testing flow
function initializeDirectTestingFlow() {
    initializeDirectUpload();
    // Directly go to step 3, configured for direct testing
    goToStep(3); 
}


// Pipeline functionality
function initializePipeline() {
  // Set initial selected input type
  selectedInputType = currentTabInput;

  // Input option selection
  document.querySelectorAll(".input-option").forEach((option) => {
    option.addEventListener("click", function () {
      const inputType = this.getAttribute("data-input");
      selectInputOption(inputType);
    });
  });

  // Progress step navigation
  document.querySelectorAll(".progress-step").forEach((step) => {
    step.addEventListener("click", function () {
      const stepNumber = parseInt(this.getAttribute("data-step"));
      if (stepNumber <= currentStep) {
        goToStep(stepNumber);
      }
    });
  });
}

function selectInputOption(inputType) {
  selectedInputType = inputType;

  // Update option selection
  document.querySelectorAll(".input-option").forEach((opt) => {
    opt.classList.remove("selected");
  });
  document
    .querySelector(`[data-input="${inputType}"]`)
    .classList.add("selected");

  // Show corresponding form
  document.querySelectorAll(".input-form").forEach((form) => {
    form.classList.remove("active");
  });
  document.getElementById(`${inputType}-form`).classList.add("active");
}

function initializeWebsiteOptions() {
  document.querySelectorAll('input[name="website-source"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      const targetForm = document.getElementById("target-url-form");
      if (this.value === "different") {
        targetForm.style.display = "block";
      } else {
        targetForm.style.display = "none";
      }
    });
  });
}

function goToStep(stepNumber) {
  currentStep = stepNumber;

  // Update progress steps
  document.querySelectorAll(".progress-step").forEach((step, index) => {
    step.classList.remove("active", "completed");
    if (index + 1 < stepNumber) {
      step.classList.add("completed");
    } else if (index + 1 === stepNumber) {
      step.classList.add("active");
    }
  });

  // Update progress connectors
  document
    .querySelectorAll(".progress-connector")
    .forEach((connector, index) => {
      connector.classList.remove("active");
      if (index + 1 < stepNumber) {
        connector.classList.add("active");
      }
    });

  // Show current step
  document.querySelectorAll(".pipeline-step").forEach((step, index) => {
    step.classList.remove("active");
    if (index + 1 === stepNumber) {
      step.classList.add("active");
    }
  });
  
  // --- MODIFIED: Conditional UI for Step 3 ---
  if (stepNumber === 3) {
      const directUpload = document.getElementById("direct-testing-upload");
      const generationOptions = document.getElementById("generation-flow-options");
      const backBtn = document.getElementById("step3-back-btn");

      if (isDirectTestingMode) {
          directUpload.style.display = "block";
          generationOptions.style.display = "none"; // Hide options related to generation flow
          backBtn.style.display = "none"; // Cannot go back
          // In direct mode, the target URL must be specified.
          document.getElementById('target-url-form').style.display = 'block';
      } else {
          directUpload.style.display = "none";
          generationOptions.style.display = "block";
          backBtn.style.display = "inline-flex";
          displaySelectedTestCases();
      }
  }
}

function goBackToStep(stepNumber) {
  goToStep(stepNumber);
}

function proceedToGeneration() {
  // Validate input based on selected type
  if (!validateCurrentInput()) {
    return;
  }

  // Store source URL if website type is selected
  if (selectedInputType === "website") {
    sourceWebsiteUrl = document
      .getElementById("source-website-url")
      .value.trim();
    updateSourceUrlDisplay();
  }

  goToStep(2);
}

function validateCurrentInput() {
  if (!selectedInputType) {
    showToast("Please select an input source.", "warning");
    return false;
  }

  switch (selectedInputType) {
    case "figma":
      const figmaKey = document.getElementById("figma-key").value.trim();
      if (!figmaKey) {
        showToast("Please enter a Figma file key.", "warning");
        return false;
      }
      break;

    case "document":
      const fileInput = document.getElementById("document-upload");
      if (!fileInput.files.length) {
        showToast("Please select a document file.", "warning");
        return false;
      }
      break;

    case "manual":
      const manualPrompt = document
        .getElementById("manual-prompt")
        .value.trim();
      if (!manualPrompt) {
        showToast("Please provide manual requirements.", "warning");
        return false;
      }
      break;

    case "website":
      const websiteUrl = document
        .getElementById("source-website-url")
        .value.trim();
      if (!websiteUrl) {
        showToast("Please enter a website URL.", "warning");
        return false;
      }
      if (!isValidUrl(websiteUrl)) {
        showToast("Please enter a valid URL.", "warning");
        return false;
      }
      break;
  }

  return true;
}

function updateSourceUrlDisplay() {
  const displayElement = document.getElementById("display-source-url");
  if (sourceWebsiteUrl) {
    displayElement.textContent = sourceWebsiteUrl;
    document.getElementById("source-url-display").style.display = "flex";
  } else {
    displayElement.textContent = "No source URL available";
    document.getElementById("source-url-display").style.display = "none";
  }
}

async function generateTestCases() {
  const generateBtn = document.getElementById("generate-btn");
  const downloadBtn = document.getElementById("download-btn");
  const nextStepBtn = document.getElementById("next-step-btn");
  const exitBtn = document.getElementById("exit-btn");
  
  const progressFill = document.querySelector(".progress-fill");
  const statusContent = document.querySelector(".status-content p");
  let progressInterval;

  try {
    // Show loading state
    generateBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Generating...';
    generateBtn.disabled = true;

    // Animate progress
    let progress = 0;
    progressInterval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90;
      progressFill.style.width = progress + "%";

      // Update status text
      if (progress < 30) {
        statusContent.textContent = "Analyzing input source...";
      } else if (progress < 60) {
        statusContent.textContent = "Generating test scenarios...";
      } else {
        statusContent.textContent = "Optimizing test cases...";
      }
    }, 200);

    // Prepare input data
    const inputData = getInputData();

    // Make API call
    const response = await fetch("/api/generate-test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inputData),
    });

    const result = await response.json();

    // Complete progress
    clearInterval(progressInterval);
    progressFill.style.width = "100%";
    statusContent.textContent = "Test cases generated successfully!";

    if (result.status === "success") {
      generatedTests = result.tests;
      showToast(
        `Generated ${generatedTests.length} test cases successfully!`,
        "success"
      );

      // Hide the generate button and show the other action buttons
      generateBtn.style.display = 'none';
      downloadBtn.style.display = 'inline-flex';
      nextStepBtn.style.display = 'inline-flex';
      exitBtn.style.display = 'inline-flex';
      
      // Display the accordion
      displayTestCasesAccordion();

    } else {
      throw new Error(result.message || "An unknown error occurred during generation.");
    }
  } catch (error) {
    console.error("Error generating tests:", error);
    showToast(error.message, "error");
    if(progressInterval) clearInterval(progressInterval);
    
    // Reset button state on error
    generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Test Cases';
    generateBtn.disabled = false;
  }
}

function getInputData() {
  let inputData = { test_type: selectedInputType };

  switch (selectedInputType) {
    case "figma":
      inputData.figma_key = document.getElementById("figma-key").value.trim();
      break;
    case "document":
      const fileInput = document.getElementById("document-upload");
      if (fileInput.files.length > 0) {
        inputData.file_name = fileInput.files[0].name;
        // The backend will handle reading the uploaded file's content
        inputData.file_content = "File content will be processed on the server.";
      }
      break;
    case "manual":
      inputData.manual_prompt = document
        .getElementById("manual-prompt")
        .value.trim();
      break;
    case "website":
      inputData.website_url = document
        .getElementById("source-website-url")
        .value.trim();
      break;
  }

  return inputData;
}

function proceedToExecution() {
  // --- MODIFIED VALIDATION ---
  if (selectedTestCases.length === 0) {
      const message = isDirectTestingMode 
          ? "Please upload a file with test cases before proceeding."
          : "Please go back and add at least one test case to execute.";
      showToast(message, "warning");
      return;
  }

  let targetUrl = "";
  if (isDirectTestingMode) {
      targetUrl = document.getElementById("target-website-url").value.trim();
      if (!targetUrl) {
          showToast("Please enter a target website URL.", "warning");
          return;
      }
      if (!isValidUrl(targetUrl)) {
          showToast("Please enter a valid URL.", "warning");
          return;
      }
  } else {
      const useSourceUrl = document.getElementById("use-source-url").checked;
      const useDifferentUrl = document.getElementById("use-different-url").checked;

      if (useSourceUrl && sourceWebsiteUrl) {
        targetUrl = sourceWebsiteUrl;
      } else if (useDifferentUrl) {
        targetUrl = document.getElementById("target-website-url").value.trim();
        if (!targetUrl) {
          showToast("Please enter a target website URL.", "warning");
          return;
        }
        if (!isValidUrl(targetUrl)) {
          showToast("Please enter a valid URL.", "warning");
          return;
        }
      } else if (useSourceUrl && !sourceWebsiteUrl) {
        showToast(
          "No source URL available. Please select a different website.",
          "warning"
        );
        return;
      }
  }

  // Update execution summary
  updateExecutionSummary(targetUrl);

  goToStep(4);
}

function updateExecutionSummary(targetUrl) {
  document.getElementById("test-count").textContent = selectedTestCases.length;
  document.getElementById("final-target-url").textContent = targetUrl;

  const liveTestingEnabled = document.getElementById(
    "live-testing-toggle"
  ).checked;
  document.getElementById("execution-mode").textContent = liveTestingEnabled
    ? "Live Testing"
    : "Standard";
}

async function executeTests() {
  const executeBtn = document.getElementById("execute-btn");
  const originalText = executeBtn.innerHTML;

  try {
    // Get target URL
    const useSourceUrl = document.getElementById("use-source-url").checked;
    const targetUrl = isDirectTestingMode 
        ? document.getElementById("target-website-url").value.trim()
        : (useSourceUrl ? sourceWebsiteUrl : document.getElementById("target-website-url").value.trim());

    const liveTestingEnabled = document.getElementById(
      "live-testing-toggle"
    ).checked;

    // Show loading state
    executeBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Executing...';
    executeBtn.disabled = true;
    showLoading("Running test cases...");

    // Make API call
    const response = await fetch("/api/run-test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        website_url: targetUrl,
        test_cases: selectedTestCases, // Use selected test cases
        live_testing: liveTestingEnabled,
      }),
    });

    const result = await response.json();

    if (result.status === "success") {
      const testResults = result.results || [];
      displayTestResults(testResults);
      showToast("Test execution completed!", "success");
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Error executing tests:", error);
    showToast("Failed to execute test cases. Please try again.", "error");
  } finally {
    // Reset button state
    executeBtn.innerHTML = originalText;
    executeBtn.disabled = false;
    hideLoading();
  }
}

// File upload functionality
function initializeFileUpload() {
  const fileUploadArea = document.getElementById("file-upload-area");
  const fileInput = document.getElementById("document-upload");
  setupDragAndDrop(fileUploadArea, fileInput, handleFileSelect);
}

// NEW: Initialize the upload area for the direct testing flow
function initializeDirectUpload() {
    const fileUploadArea = document.getElementById("direct-test-case-upload-area");
    const fileInput = document.getElementById("direct-test-case-upload");
    setupDragAndDrop(fileUploadArea, fileInput, handleDirectFileSelect);
}

// NEW: Reusable drag and drop setup
function setupDragAndDrop(area, input, fileHandler) {
    area.addEventListener("click", () => input.click());

    area.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.currentTarget.classList.add("dragover");
    });

    area.addEventListener("dragleave", (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("dragover");
    });

    area.addEventListener("drop", (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("dragover");
        const files = e.dataTransfer.files;
        if (files.length > 0) fileHandler(files[0]);
    });

    input.addEventListener("change", (e) => {
        if (e.target.files.length > 0) fileHandler(e.target.files[0]);
    });
}


// Handle file selection for generation flow
function handleFileSelect(file) {
  const uploadContent = document.querySelector("#file-upload-area .upload-content");
  if (validateFile(file)) {
    updateUploadUI(uploadContent, file.name);
    showToast("File selected successfully!", "success");
  }
}

// NEW: Handle file selection for direct testing flow
async function handleDirectFileSelect(file) {
    const uploadContent = document.querySelector("#direct-test-case-upload-area .upload-content");
    if (validateFile(file)) {
        updateUploadUI(uploadContent, file.name);
        await parseAndLoadTests(file);
    }
}

// NEW: Reusable file validation
function validateFile(file) {
    const allowedTypes = [".pdf", ".doc", ".docx"];
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
        showToast("Please select a PDF, DOC, or DOCX file.", "error");
        return false;
    }

    if (file.size > 16 * 1024 * 1024) { // 16MB
        showToast("File size must be less than 16MB.", "error");
        return false;
    }
    return true;
}

// NEW: Reusable UI update for file upload
function updateUploadUI(contentElement, fileName) {
    contentElement.innerHTML = `
        <i class="fas fa-file-check" style="color: #10b981;"></i>
        <p><strong>${fileName}</strong></p>
        <small>Click again or drag to replace</small>
    `;
}

// MODIFIED: Function to parse uploaded test cases and display them
async function parseAndLoadTests(file) {
    showLoading("Parsing your test case file...");
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("/api/parse-tests-from-file", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();
        if (result.status === "success" && result.tests) {
            selectedTestCases = result.tests;
            // The line below was removed to prevent displaying the list inside the circle.
            // displaySelectedTestCases(); 
            displayParsedTestsBelowCircle(result.tests);
            showToast(`Successfully parsed ${result.tests.length} test cases.`, "success");
        } else {
            throw new Error(result.message || "Failed to parse test cases from file.");
        }
    } catch (error) {
        console.error("Error parsing file:", error);
        showToast(error.message, "error");
        selectedTestCases = []; // Clear any partial data
        // The line below was removed to prevent displaying an empty list inside the circle on error.
        // displaySelectedTestCases(); 
        displayParsedTestsBelowCircle([]);
    } finally {
        hideLoading();
    }
}

// NEW: Function to display parsed test titles below the main circle
function displayParsedTestsBelowCircle(tests) {
    const container = document.getElementById('parsed-tests-display-container');
    if (!container) return;

    if (tests.length === 0) {
        container.style.display = 'none';
        return;
    }

    let contentHTML = `
        <div class="accordion-header">
            <h3>Test Cases Ready for Execution</h3>
        </div>
        <ul id="parsed-tests-list">
    `;

    tests.forEach(test => {
        contentHTML += `
            <li class="parsed-test-item">
                <i class="fas fa-vial"></i>
                <span>${test.id}: ${test.name}</span>
            </li>
        `;
    });

    contentHTML += '</ul>';
    container.innerHTML = contentHTML;
    container.style.display = 'block';

    // Smoothly scroll to the new section
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// Smooth scrolling function
function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    const headerHeight = 70;
    const elementPosition = element.offsetTop - headerHeight;
    window.scrollTo({ top: elementPosition, behavior: "smooth" });
  }
}

// --- ACCORDION FUNCTIONS ---
function displayTestCasesAccordion() {
    const container = document.getElementById('test-case-accordion-container');
    if (!container) return;

    let accordionHTML = `
        <div class="accordion-header">
            <h3>Generated Test Cases</h3>
            <button class="btn btn-secondary" onclick="addAllTestCases()">Add All</button>
        </div>
    `;

    generatedTests.forEach(test => {
        accordionHTML += `
            <div class="accordion-item">
                <button class="accordion-button">
                    <span>${test.id}: ${test.name}</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="accordion-content">
                    <p><strong>Description:</strong> ${test.description}</p>
                    <p><strong>Type:</strong> ${test.type}</p>
                    <p><strong>Selector:</strong> <code>${test.selector || 'N/A'}</code></p>
                    <div class="toggle-label" style="margin-top: 15px;">
                        <input type="checkbox" id="test-case-${test.id}" class="toggle-input" data-testid="${test.id}">
                        <span class="toggle-slider"></span>
                        <span>Add to Test</span>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = accordionHTML;
    container.style.display = 'block';

    // Add event listeners for accordion functionality
    document.querySelectorAll('.accordion-button').forEach(button => {
        button.addEventListener('click', () => {
            const content = button.nextElementSibling;
            button.classList.toggle('active');
            content.classList.toggle('active');
        });
    });

    // --- FIXED EVENT LISTENERS ---
    // Add event listeners for the new toggle buttons
    document.querySelectorAll('.accordion-content .toggle-input').forEach(toggle => {
        toggle.addEventListener('change', (event) => {
            const testId = parseInt(event.target.dataset.testid, 10);
            toggleTestCaseSelection(testId);
        });
    });
}

function toggleTestCaseSelection(testId) {
    const test = generatedTests.find(t => t.id === testId);
    if (!test) return;

    const index = selectedTestCases.findIndex(t => t.id === testId);
    if (index > -1) {
        // Remove from selection
        selectedTestCases.splice(index, 1);
    } else {
        // Add to selection
        selectedTestCases.push(test);
    }
}

function addAllTestCases() {
    selectedTestCases = [...generatedTests];
    // Check all toggle boxes
    document.querySelectorAll('.accordion-content .toggle-input').forEach(toggle => {
        toggle.checked = true;
    });
    showToast(`Added all ${generatedTests.length} test cases to the test suite.`, "success");
}

function displaySelectedTestCases() {
    const displayArea = document.getElementById('selected-tests-display-area');
    if (!displayArea) return;

    if (selectedTestCases.length === 0) {
        displayArea.innerHTML = '<h4>No test cases selected for execution.</h4>';
        return;
    }

    let listHTML = '<h4>Selected Test Cases for Execution:</h4><ul id="selected-tests-list">';
    selectedTestCases.forEach(test => {
        listHTML += `<li>${test.id}: ${test.name}</li>`;
    });
    listHTML += '</ul>';

    displayArea.innerHTML = listHTML;
}


// Display test results and add a download button
function displayTestResults(results) {
    const resultsSection = document.getElementById("results-section");
    const resultsHeader = resultsSection.querySelector('.results-header');
    const testResultsList = document.getElementById("test-results-list");
    const passedCount = document.getElementById("passed-count");
    const failedCount = document.getElementById("failed-count");

    const passed = results.filter((r) => r.status === "passed").length;
    const failed = results.filter((r) => r.status === "failed").length;

    passedCount.textContent = passed;
    failedCount.textContent = failed;

    // Add a download button to the header
    if (resultsHeader) {
        let actionsContainer = resultsHeader.querySelector('.results-actions');
        if (!actionsContainer) {
            actionsContainer = document.createElement('div');
            actionsContainer.className = 'results-actions';
            resultsHeader.appendChild(actionsContainer);
        }
        
        // Ensure button is not duplicated
        if (!actionsContainer.querySelector('.btn-download')) {
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'btn btn-secondary btn-download';
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download as DOCX';
            downloadBtn.onclick = downloadTests; // This calls the updated download function
            actionsContainer.appendChild(downloadBtn);
        }
    }

    if (results.length === 0) {
        testResultsList.innerHTML = `<p class="text-center" style="padding: 20px; color: var(--gray-500);">No test results to display. The test run may have completed without returning specific results.</p>`;
    } else {
        testResultsList.innerHTML = results
            .map(
                (result) => `
        <div class="test-result ${result.status}">
          <h5>
            <i class="fas ${
              result.status === "passed" ? "fa-check-circle" : "fa-times-circle"
            }"></i>
            ${result.name}
          </h5>
          <p><strong>Status:</strong> ${result.status.toUpperCase()}</p>
          <p><strong>Duration:</strong> ${result.duration}ms</p>
          <p><strong>Message:</strong> ${result.message}</p>
        </div>
      `
            )
            .join("");
    }


    resultsSection.style.display = "block";
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Download test cases as a DOCX file by calling the backend
async function downloadTests() {
  if (generatedTests.length === 0) {
    showToast("No generated test cases to download.", "warning");
    return;
  }

  showLoading("Generating DOCX file...");

  try {
    const response = await fetch("/api/download-tests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ test_cases: generatedTests }),
    });

    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({ message: "Failed to download file. Server returned an error." }));
      throw new Error(errorResult.message);
    }

    // Handle the file blob response
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "generated_test_cases.docx"; // Set the correct filename
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showToast("DOCX file downloaded successfully!", "success");

  } catch (error) {
    console.error("Error downloading test cases:", error);
    showToast(error.message || "An error occurred while downloading.", "error");
  } finally {
    hideLoading();
  }
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

function showLoading(message = "Loading...") {
  loadingText.textContent = message;
  loadingOverlay.classList.add("show");
}

function hideLoading() {
  loadingOverlay.classList.remove("show");
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const iconMap = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
    warning: "fas fa-exclamation-triangle",
    info: "fas fa-info-circle",
  };

  const titleMap = {
    success: "Success",
    error: "Error",
    warning: "Warning",
    info: "Info",
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
  toast.addEventListener("click", () => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  });
}
