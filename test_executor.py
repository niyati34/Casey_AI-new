import os
from typing import List, Dict, Tuple, Optional
import re
import requests

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException


def _create_driver() -> webdriver.Chrome:
    """Create a Chrome WebDriver using Selenium Manager (no manual driver install)."""
    headless = os.getenv("SELENIUM_HEADLESS", "1") not in ("0", "false", "False")
    window_size = os.getenv("SELENIUM_WINDOW_SIZE", "1366,900")

    options = Options()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument(f"--window-size={window_size}")
    options.add_argument("--start-maximized")
    options.add_argument("--disable-infobars")
    options.add_argument("--disable-extensions")

    driver = webdriver.Chrome(options=options)
    driver.set_page_load_timeout(int(os.getenv("SELENIUM_PAGELOAD_TIMEOUT", "30")))
    return driver


def _loc_strategy(selector: str) -> Tuple[By, str]:
    """Infer a locating strategy from a provided selector string.
    Supports: xpath (//), id=, name=, css=, css:, otherwise defaults to CSS.
    """
    if not selector:
        return By.CSS_SELECTOR, "*"
    sel = selector.strip()
    sel_lower = sel.lower()
    if sel.startswith("//") or sel.startswith(".//") or sel_lower.startswith("xpath="):
        return By.XPATH, sel.split("=", 1)[1] if "=" in sel else sel
    if sel_lower.startswith("id="):
        return By.ID, sel.split("=", 1)[1]
    if sel_lower.startswith("name="):
        return By.NAME, sel.split("=", 1)[1]
    if sel_lower.startswith("css=") or sel_lower.startswith("css:"):
        return By.CSS_SELECTOR, sel.split(":", 1)[1] if ":" in sel_lower else sel.split("=", 1)[1]
    # Default CSS selector
    return By.CSS_SELECTOR, sel


def _extract_text_to_type(description: str) -> Optional[str]:
    """Try to extract a quoted text value from description, e.g., Enter "email" into ..."""
    if not description:
        return None
    # Look for quoted text
    m = re.search(r"['\"]([^'\"]+)['\"]", description)
    if m:
        return m.group(1)
    # Or look after words 'enter ' or 'type '
    m2 = re.search(r"(?:enter|type)\s+([^\n\r]+?)(?:\s+into|$)", description, flags=re.IGNORECASE)
    return m2.group(1).strip() if m2 else None


def _perform_action(driver: webdriver.Chrome, by: By, value: str, description: str) -> str:
    """Perform inferred action: click or type; otherwise presence check."""
    desc = (description or "").lower()
    # Type text
    if any(k in desc for k in ["enter", "type", "input"]):
        elem = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((by, value)))
        elem.clear()
        text = _extract_text_to_type(description) or ""
        elem.send_keys(text)
        return f"Typed text into element."
    # Click action
    if any(k in desc for k in ["click", "press", "tap"]):
        elem = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((by, value)))
        elem.click()
        return "Clicked element as described."
    # Default presence verification
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((by, value)))
    return "Verified presence only."


def run_ui_tests(website_url: str, tests: List[Dict]) -> List[Dict]:
    """Run a simple UI test suite using Selenium.

    Each test should include: id, name, description, selector.
    Behaviour:
      - Loads website_url once at the start.
      - For each test: waits for element located by selector; if description suggests clicking, performs a click.
      - Returns a list of result dicts with status passed/failed and a message.
    """
    results: List[Dict] = []
    try:
        driver = _create_driver()
    except WebDriverException as e:
        return [{"id": t.get("id"), "name": t.get("name", "Unnamed Test"), "status": "failed", "message": f"WebDriver init failed: {str(e)}"} for t in tests]

    try:
        driver.get(website_url)
        for test in tests:
            test_id = test.get("id")
            name = test.get("name", f"Test {test_id}")
            selector = test.get("selector") or test.get("locator")
            description = test.get("description", "")
            by, value = _loc_strategy(selector or "")

            try:
                action_msg = _perform_action(driver, by, value, description)
                results.append({
                    "id": test_id,
                    "name": name,
                    "status": "passed",
                    "message": f"Element found by {by}='{value}'. {action_msg}"
                })
            except TimeoutException:
                results.append({
                    "id": test_id,
                    "name": name,
                    "status": "failed",
                    "message": f"Timeout waiting for element using {by}='{value}'."
                })
            except Exception as e:
                results.append({
                    "id": test_id,
                    "name": name,
                    "status": "failed",
                    "message": f"Error executing test: {str(e)}"
                })
        return results
    finally:
        try:
            driver.quit()
        except Exception:
            pass


def run_api_tests(base_url: str, tests: List[Dict]) -> List[Dict]:
    """Execute simple API tests using requests. Each test can include:
    - method: GET/POST/PUT/DELETE (default GET)
    - endpoint: path or full URL
    - expected_status: integer HTTP status (default 200)
    - headers: dict
    - body/json: request payload
    """
    results: List[Dict] = []
    session = requests.Session()
    timeout = int(os.getenv("API_TEST_TIMEOUT", "20"))
    for t in tests:
        name = t.get("name", "API Test")
        method = str(t.get("method", "GET")).upper()
        endpoint = t.get("endpoint") or t.get("url") or ""
        url = endpoint if endpoint.startswith("http") else base_url.rstrip("/") + "/" + endpoint.lstrip("/")
        expected = int(t.get("expected_status", 200))
        headers = t.get("headers") or {}
        data = t.get("body")
        json_body = t.get("json")
        try:
            resp = session.request(method, url, headers=headers, data=data, json=json_body, timeout=timeout)
            status = "passed" if resp.status_code == expected else "failed"
            msg = f"HTTP {method} {url} -> {resp.status_code} (expected {expected})"
            results.append({"id": t.get("id"), "name": name, "status": status, "message": msg})
        except Exception as e:
            results.append({"id": t.get("id"), "name": name, "status": "failed", "message": str(e)})
    return results


def run_tests(website_url: str, tests: List[Dict]) -> List[Dict]:
    """Entry point to run different kinds of tests based on 'type'.
    Routes UI/Functional to Selenium. Routes API tests to requests. Others skipped.
    """
    ui_like = ["ui", "functional", "smoke", "regression"]
    api_like = ["api", "http"]
    ui_tests = [t for t in tests if str(t.get("type", "")).strip().lower() in ui_like or not t.get("type")]
    api_tests = [t for t in tests if str(t.get("type", "")).strip().lower() in api_like]
    other_tests = [t for t in tests if t not in ui_tests and t not in api_tests]

    results = []
    if ui_tests:
        results.extend(run_ui_tests(website_url, ui_tests))
    if api_tests:
        results.extend(run_api_tests(website_url, api_tests))

    # Mark non-implemented test types as skipped
    for t in other_tests:
        results.append({
            "id": t.get("id"),
            "name": t.get("name", "Unnamed Test"),
            "status": "skipped",
            "message": f"Runner for type '{t.get('type')}' not implemented yet."
        })

    return results
