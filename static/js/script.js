// Global variables
let currentTabInput = "figma";
let generatedTests = [];
let selectedTestCases = []; // To store test cases selected for live testing
let testResults = []; // To store the results from the test execution
let currentStep = 1;
let sourceWebsiteUrl = "";
let selectedInputType = "";
let isDirectTestingMode = false; // To track the user's chosen flow

// DOM Elements
const loadingOverlay = document.getElementById("loading-overlay");
const loadingText = document.getElementById("loading-text");
const toastContainer = document.getElementById("toast-container");

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeEventListeners();
  initializePipelineChoice();
});

// Event Listeners
function initializeEventListeners() {
  // Smooth scrolling for navigation
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href").substring(1);
      scrollToSection(targetId);
      document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // Window scroll event for header
  window.addEventListener("scroll", function () {
    const header = document.querySelector(".header");
    header.classList.toggle("scrolled", window.scrollY > 50);
  });
}

// Handle the initial choice between generating tests and direct testing
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
        progressContainer.style.display = "none";
        mainContainer.style.display = "block";
        initializeDirectTestingFlow();
    });
}

// Setup for the test generation flow
function initializeGenerationFlow() {
    initializeFileUpload();
    initializePipeline();
    initializeWebsiteOptions();
    goToStep(1);
}

// Setup for the direct live testing flow
function initializeDirectTestingFlow() {
    initializeDirectUpload();
    goToStep(3);
}

// Pipeline functionality
function initializePipeline() {
  selectedInputType = currentTabInput;
  document.querySelectorAll(".input-option").forEach((option) => {
    option.addEventListener("click", function () {
      selectInputOption(this.getAttribute("data-input"));
    });
  });
  document.querySelectorAll(".progress-step").forEach((step) => {
    step.addEventListener("click", function () {
      const stepNumber = parseInt(this.getAttribute("data-step"));
      if (stepNumber <= currentStep) goToStep(stepNumber);
    });
  });
}

function selectInputOption(inputType) {
  selectedInputType = inputType;
  document.querySelectorAll(".input-option").forEach((opt) => {
    opt.classList.remove("selected");
  });
  document.querySelector(`[data-input="${inputType}"]`).classList.add("selected");
  document.querySelectorAll(".input-form").forEach((form) => {
    form.classList.remove("active");
  });
  document.getElementById(`${inputType}-form`).classList.add("active");
}

function initializeWebsiteOptions() {
  document.querySelectorAll('input[name="website-source"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      document.getElementById("target-url-form").style.display = this.value === "different" ? "block" : "none";
    });
  });
}

function goToStep(stepNumber) {
  currentStep = stepNumber;
  const testListContainer = document.getElementById('test-list-display-container');

  document.querySelectorAll(".progress-step").forEach((step, index) => {
    step.classList.remove("active", "completed");
    if (index + 1 < stepNumber) step.classList.add("completed");
    else if (index + 1 === stepNumber) step.classList.add("active");
  });

  document.querySelectorAll(".pipeline-step").forEach((step, index) => {
    step.classList.toggle("active", index + 1 === stepNumber);
  });

  // Logic to show/hide test lists based on the current step
  if (stepNumber === 2 && !isDirectTestingMode && generatedTests.length > 0) {
    displayTestCasesAccordion();
  } else if (stepNumber === 3) {
    if (isDirectTestingMode) {
        document.getElementById("direct-testing-upload").style.display = "block";
        document.getElementById("generation-flow-options").style.display = "none";
        document.getElementById("step3-back-btn").style.display = "none";
        document.getElementById('target-url-form').style.display = 'block';
    } else {
        document.getElementById("direct-testing-upload").style.display = "none";
        document.getElementById("generation-flow-options").style.display = "block";
        document.getElementById("step3-back-btn").style.display = "inline-flex";
        displayTestListBelowCircle(selectedTestCases, "Selected Test Cases for Execution");
    }
  } else {
      if(testListContainer) testListContainer.style.display = 'none';
  }
}


function goBackToStep(stepNumber) {
  goToStep(stepNumber);
}

function proceedToGeneration() {
  if (!validateCurrentInput()) return;
  if (selectedInputType === "website") {
    sourceWebsiteUrl = document.getElementById("source-website-url").value.trim();
    updateSourceUrlDisplay();
  }
  goToStep(2);
}

function validateCurrentInput() {
  if (!selectedInputType) {
    showToast("Please select an input source.", "warning");
    return false;
  }
  const inputs = {
      figma: document.getElementById("figma-key").value.trim(),
      document: document.getElementById("document-upload").files.length,
      manual: document.getElementById("manual-prompt").value.trim(),
      website: document.getElementById("source-website-url").value.trim()
  };
  const messages = {
      figma: "Please enter a Figma file key.",
      document: "Please select a document file.",
      manual: "Please provide manual requirements.",
      website: "Please enter a website URL."
  };
  if (!inputs[selectedInputType]) {
      showToast(messages[selectedInputType], "warning");
      return false;
  }
  if (selectedInputType === "website" && !isValidUrl(inputs.website)) {
      showToast("Please enter a valid URL.", "warning");
      return false;
  }
  return true;
}

function updateSourceUrlDisplay() {
  const displayElement = document.getElementById("display-source-url");
  const displayContainer = document.getElementById("source-url-display");
  if (sourceWebsiteUrl) {
    displayElement.textContent = sourceWebsiteUrl;
    displayContainer.style.display = "flex";
  } else {
    displayElement.textContent = "No source URL available";
    displayContainer.style.display = "none";
  }
}

async function generateTestCases() {
  const generateBtn = document.getElementById("generate-btn");
  const downloadBtn = document.getElementById("download-btn");
  const nextStepBtn = document.getElementById("next-step-btn");
  const exitBtn = document.getElementById("exit-btn");
  const generationStatus = document.querySelector('.generation-status');
  
  try {
    showLoading("Generating test cases...");
    generateBtn.disabled = true;
    generationStatus.style.display = 'block';

    const inputData = getInputData();
    const response = await fetch("/api/generate-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputData),
    });
    const result = await response.json();
    
    if (result.status === "success" && Array.isArray(result.tests)) {
        generatedTests = result.tests;
        showToast(`Generated ${generatedTests.length} test cases successfully!`, "success");
        generateBtn.style.display = 'none';
        generationStatus.style.display = 'none';
        downloadBtn.style.display = 'inline-flex';
        nextStepBtn.style.display = 'inline-flex';
        exitBtn.style.display = 'inline-flex';
        displayTestCasesAccordion();
    } else {
        throw new Error(result.message || "An unknown error occurred during generation.");
    }
  } catch (error) {
    console.error("Error generating tests:", error);
    showToast(error.message, "error");
    generateBtn.disabled = false;
  } finally {
    hideLoading();
  }
}

function getInputData() {
  let inputData = { test_type: selectedInputType };
  switch (selectedInputType) {
    case "figma": inputData.figma_key = document.getElementById("figma-key").value.trim(); break;
    case "document":
      const fileInput = document.getElementById("document-upload");
      if (fileInput.files.length > 0) {
        inputData.file_name = fileInput.files[0].name;
        // In a real app, you'd handle the file content upload here, perhaps with FormData
        inputData.file_content = "File content will be processed on the server.";
      }
      break;
    case "manual": inputData.manual_prompt = document.getElementById("manual-prompt").value.trim(); break;
    case "website": inputData.website_url = document.getElementById("source-website-url").value.trim(); break;
  }
  return inputData;
}

function proceedToExecution() {
  if (selectedTestCases.length === 0) {
      showToast(isDirectTestingMode ? "Please upload a file with test cases." : "Please select at least one test case.", "warning");
      return;
  }
  let targetUrl = document.getElementById("target-website-url").value.trim();
  
  if (!isDirectTestingMode) {
      const useSourceUrl = document.getElementById("use-source-url").checked;
      if (useSourceUrl) {
          if (!sourceWebsiteUrl) {
              showToast("No source URL available. Please specify a different website.", "warning");
              return;
          }
          targetUrl = sourceWebsiteUrl;
      }
  }

  if (!targetUrl || !isValidUrl(targetUrl)) {
      showToast("Please enter a valid target URL.", "warning");
      return;
  }

  updateExecutionSummary(targetUrl);
  goToStep(4);
}

function updateExecutionSummary(targetUrl) {
  document.getElementById("test-count").textContent = selectedTestCases.length;
  document.getElementById("final-target-url").textContent = targetUrl;
  const liveTestingEnabled = document.getElementById("live-testing-toggle").checked;
  document.getElementById("execution-mode").textContent = liveTestingEnabled ? "Live Testing" : "Standard";
}

async function executeTests() {
  const executeBtn = document.getElementById("execute-btn");
  try {
    const targetUrl = document.getElementById("final-target-url").textContent;
    showLoading("Running test cases...");
    executeBtn.disabled = true;

    const response = await fetch("/api/run-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ website_url: targetUrl, test_cases: selectedTestCases }),
    });
    const result = await response.json();
    if (result.status === "success") {
      testResults = result.results || []; // Store results
      displayTestResults(testResults);
      document.getElementById('download-results-btn').style.display = 'inline-flex'; // Show download button
      showToast("Test execution completed!", "success");
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Error executing tests:", error);
    showToast("Failed to execute test cases.", "error");
  } finally {
    executeBtn.disabled = false;
    hideLoading();
  }
}

function initializeFileUpload() {
  const fileUploadArea = document.getElementById("file-upload-area");
  const fileInput = document.getElementById("document-upload");
  setupDragAndDrop(fileUploadArea, fileInput, handleFileSelect);
}

function initializeDirectUpload() {
    const fileUploadArea = document.getElementById("direct-test-case-upload-area");
    const fileInput = document.getElementById("direct-test-case-upload");
    setupDragAndDrop(fileUploadArea, fileInput, handleDirectFileSelect);
}

function setupDragAndDrop(area, input, fileHandler) {
    area.addEventListener("click", () => input.click());
    area.addEventListener("dragover", (e) => { e.preventDefault(); e.currentTarget.classList.add("dragover"); });
    area.addEventListener("dragleave", (e) => e.currentTarget.classList.remove("dragover"));
    area.addEventListener("drop", (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("dragover");
        if (e.dataTransfer.files.length > 0) fileHandler(e.dataTransfer.files[0]);
    });
    input.addEventListener("change", (e) => {
        if (e.target.files.length > 0) fileHandler(e.target.files[0]);
    });
}

function handleFileSelect(file) {
  const uploadContent = document.querySelector("#file-upload-area .upload-content");
  if (validateFile(file)) {
    updateUploadUI(uploadContent, file.name);
    showToast("File selected successfully!", "success");
  }
}

async function handleDirectFileSelect(file) {
    const uploadContent = document.querySelector("#direct-test-case-upload-area .upload-content");
    if (validateFile(file)) {
        updateUploadUI(uploadContent, file.name);
        await parseAndLoadTests(file);
    }
}

function validateFile(file) {
    const allowedTypes = [".pdf", ".doc", ".docx"];
    const fileExtension = `.${file.name.split(".").pop().toLowerCase()}`;
    if (!allowedTypes.includes(fileExtension)) {
        showToast("Please select a PDF, DOC, or DOCX file.", "error");
        return false;
    }
    if (file.size > 16 * 1024 * 1024) {
        showToast("File size must be less than 16MB.", "error");
        return false;
    }
    return true;
}

function updateUploadUI(contentElement, fileName) {
    contentElement.innerHTML = `
        <i class="fas fa-file-check" style="color: #10b981;"></i>
        <p><strong>${fileName}</strong></p>
        <small>Click or drag to replace</small>
    `;
}

async function parseAndLoadTests(file) {
    showLoading("Parsing your test case file...");
    const formData = new FormData();
    formData.append("file", file);
    try {
        const response = await fetch("/api/parse-tests-from-file", { method: "POST", body: formData });
        const result = await response.json();
        if (result.status === "success" && result.tests) {
            selectedTestCases = result.tests;
            displayTestListBelowCircle(result.tests, "Test Cases Ready for Execution");
            showToast(`Successfully parsed ${result.tests.length} test cases.`, "success");
        } else {
            throw new Error(result.message || "Failed to parse test cases from file.");
        }
    } catch (error) {
        console.error("Error parsing file:", error);
        showToast(error.message, "error");
        selectedTestCases = [];
        displayTestListBelowCircle([], "");
    } finally {
        hideLoading();
    }
}

function displayTestListBelowCircle(tests, title) {
    const container = document.getElementById('test-list-display-container');
    if (!container) return;
    if (tests.length === 0) {
        container.style.display = 'none';
        return;
    }
    let contentHTML = `
        <div class="accordion-header"><h3>${title}</h3></div>
        <ul class="test-list-items">
            ${tests.map(test => `
                <li class="parsed-test-item">
                    <i class="fas fa-vial"></i>
                    <span>${test.id}: ${test.name}</span>
                </li>`).join('')}
        </ul>`;
    container.innerHTML = contentHTML;
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    const headerHeight = 70;
    window.scrollTo({ top: element.offsetTop - headerHeight, behavior: "smooth" });
  }
}

function displayTestCasesAccordion() {
    const container = document.getElementById('test-list-display-container');
    if (!container) return;
    const selectedIds = new Set(selectedTestCases.map(t => t.id));

    let accordionHTML = `
        <div class="accordion-header">
            <h3>Generated Test Cases</h3>
            <button class="btn btn-secondary" onclick="addAllTestCases()">Select All</button>
        </div>
        ${generatedTests.map(test => `
            <div class="accordion-item">
                <button class="accordion-button" onclick="this.classList.toggle('active'); this.nextElementSibling.classList.toggle('active');">
                    <span>${test.id}: ${test.name}</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="accordion-content">
                    <p><strong>Description:</strong> ${test.description}</p>
                    <p><strong>Type:</strong> ${test.type}</p>
                    <p><strong>Selector:</strong> <code>${test.selector || 'N/A'}</code></p>
                    <label class="checkbox-label">
                        <input type="checkbox" class="checkbox-input" data-testid="${test.id}" onchange="toggleTestCaseSelection(event)" ${selectedIds.has(test.id) ? 'checked' : ''}>
                        <span class="checkbox-custom"></span>
                        Select Test Case
                    </label>
                </div>
            </div>`).join('')}
    `;
    container.innerHTML = accordionHTML;
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleTestCaseSelection(event) {
    const testId = parseInt(event.target.dataset.testid, 10);
    const test = generatedTests.find(t => t.id === testId);
    if (!test) return;
    const index = selectedTestCases.findIndex(t => t.id === testId);
    if (index > -1) {
        selectedTestCases.splice(index, 1);
    } else {
        selectedTestCases.push(test);
    }
}

function addAllTestCases() {
    selectedTestCases = [...generatedTests];
    document.querySelectorAll('.accordion-content .checkbox-input').forEach(checkbox => {
        checkbox.checked = true;
    });
    showToast(`Selected all ${generatedTests.length} test cases.`, "success");
}

function displayTestResults(results) {
    const resultsSection = document.getElementById("results-section");
    const testResultsList = document.getElementById("test-results-list");
    const passedCount = document.getElementById("passed-count");
    const failedCount = document.getElementById("failed-count");
    const passed = results.filter(r => r.status === "passed").length;
    const failed = results.length - passed;
    passedCount.textContent = passed;
    failedCount.textContent = failed;

    testResultsList.innerHTML = results.length === 0 ?
        `<p>No test results to display.</p>` :
        results.map(result => `
            <div class="test-result ${result.status}">
              <h5><i class="fas ${result.status === "passed" ? "fa-check-circle" : "fa-times-circle"}"></i>${result.name}</h5>
              <p><strong>Status:</strong> ${result.status.toUpperCase()}</p>
            </div>`).join("");
    resultsSection.style.display = "block";
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function downloadTests() {
  if (generatedTests.length === 0) {
    showToast("No generated test cases to download.", "warning");
    return;
  }
  showLoading("Generating DOCX file...");
  try {
    const response = await fetch("/api/download-tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test_cases: generatedTests }),
    });
    if (!response.ok) {
      throw new Error("Failed to download file.");
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated_test_cases.docx";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    showToast("DOCX file downloaded successfully!", "success");
  } catch (error) {
    console.error("Error downloading test cases:", error);
    showToast(error.message, "error");
  } finally {
    hideLoading();
  }
}

async function downloadTestResults() {
  if (testResults.length === 0) {
    showToast("No test results to download.", "warning");
    return;
  }
  showLoading("Generating results DOCX...");
  try {
    const response = await fetch("/api/download-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test_results: testResults }),
    });
    if (!response.ok) {
      throw new Error("Failed to download results file.");
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "test_execution_results.docx";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    showToast("Results file downloaded successfully!", "success");
  } catch (error) {
    console.error("Error downloading test results:", error);
    showToast(error.message, "error");
  } finally {
    hideLoading();
  }
}


// Utility Functions
function isValidUrl(string) {
  try { new URL(string); return true; } catch (_) { return false; }
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
  const iconMap = { success: "fas fa-check-circle", error: "fas fa-exclamation-circle", warning: "fas fa-exclamation-triangle", info: "fas fa-info-circle" };
  const titleMap = { success: "Success", error: "Error", warning: "Warning", info: "Info" };
  toast.innerHTML = `
        <div class="toast-header"><i class="${iconMap[type]}"></i> ${titleMap[type]}</div>
        <div class="toast-body">${message}</div>`;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
  toast.addEventListener("click", () => toast.remove());
}
