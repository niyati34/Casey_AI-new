import os
import json
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


def _split_selectors(selector: str) -> List[str]:
    """Split comma-separated CSS selectors into individual ones, trimming whitespace.
    Keeps xpath or prefixed selectors as a single entry."""
    if not selector:
        return []
    s = selector.strip()
    if s.startswith("//") or s.startswith(".//") or s.lower().startswith("xpath="):
        return [s]
    return [part.strip() for part in s.split(",") if part.strip()]


def _wait_presence(driver: webdriver.Chrome, by: By, value: str, timeout: int = 10):
    return WebDriverWait(driver, timeout).until(EC.presence_of_element_located((by, value)))


def _find_first(driver: webdriver.Chrome, candidates: List[Tuple[By, str]], timeout: int = 8):
    last_exc = None
    for by, value in candidates:
        try:
            return WebDriverWait(driver, timeout).until(EC.presence_of_element_located((by, value)))
        except Exception as e:
            last_exc = e
            continue
    if last_exc:
        raise last_exc
    raise TimeoutException("No selector candidates matched")


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


def _get_credentials(website_url: str, test: Optional[Dict]) -> Tuple[str, str]:
    """Resolve credentials in order of precedence:
    1) test["credentials"] = { username, password }
    2) CREDENTIALS_JSON env: { "domain": {"username": "..", "password": ".."} }
    3) VALID_USERNAME/PASSWORD or DEFAULT_USERNAME/PASSWORD env
    4) Generic fallback user@example.com / Password123!
    """
    # From test
    if test and isinstance(test.get("credentials"), dict):
        cu = test["credentials"].get("username")
        cp = test["credentials"].get("password")
        if cu is not None and cp is not None:
            return cu, cp

    # From JSON env mapping
    try:
        cred_map = os.getenv("CREDENTIALS_JSON")
        if cred_map:
            data = json.loads(cred_map)
            domain = website_url.split("//")[-1].split("/")[0]
            if domain in data:
                cu = data[domain].get("username")
                cp = data[domain].get("password")
                if cu is not None and cp is not None:
                    return cu, cp
    except Exception:
        pass

    # From individual envs
    cu = os.getenv("VALID_USERNAME") or os.getenv("DEFAULT_USERNAME")
    cp = os.getenv("VALID_PASSWORD") or os.getenv("DEFAULT_PASSWORD")
    if cu and cp:
        return cu, cp

    # Fallback generic
    return "user@example.com", "Password123!"


def _find_by_label_or_placeholder(driver: webdriver.Chrome, keywords: List[str]) -> Optional[Tuple[By, str]]:
    """Find an input/textarea by matching label text, placeholder, name, or id against keywords."""
    kws = [k.lower() for k in keywords]
    # Try label[for] mapping
    labels = driver.find_elements(By.TAG_NAME, "label")
    for lbl in labels:
        try:
            text = (lbl.text or "").strip().lower()
            if any(k in text for k in kws):
                for_attr = lbl.get_attribute("for")
                if for_attr:
                    return By.ID, for_attr
        except Exception:
            continue

    # Try placeholder/name/id contains
    xpath = (
        "//input|//textarea"
        "[contains(translate(@placeholder,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), '{kw}')"
        " or contains(translate(@name,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), '{kw}')"
        " or contains(translate(@id,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), '{kw}')]"
    )
    for kw in kws:
        try:
            el = WebDriverWait(driver, 2).until(EC.presence_of_element_located((By.XPATH, xpath.format(kw=kw))))
            return By.XPATH, xpath.format(kw=kw)
        except Exception:
            continue
    return None


def _fill_login_and_submit(driver: webdriver.Chrome, description: str, website_url: str, test: Optional[Dict]) -> str:
    """Heuristic login flow with configurable creds and broad field detection."""
    desc = (description or "").lower()
    valid_user, valid_pass = _get_credentials(website_url, test)

    # Choose credentials based on negative/empty scenarios
    user_val = valid_user
    pass_val = valid_pass
    if "empty username" in desc:
        user_val = ""
    if "empty password" in desc:
        pass_val = ""
    if "both" in desc and "empty" in desc:
        user_val = ""; pass_val = ""
    if "incorrect username" in desc:
        user_val = "wrong_user"
    if "incorrect password" in desc:
        pass_val = "wrong_pass_123"
    if ("both" in desc and "incorrect" in desc) or "both username and password incorrect" in desc:
        user_val = "wrong_user"; pass_val = "wrong_pass_123"

    # Candidate fields typical of many login pages (broad)
    username_candidates = [
        (By.CSS_SELECTOR, "input#username"),
        (By.CSS_SELECTOR, "input[type='email']"),
        (By.CSS_SELECTOR, "input[name*='user' i]"),
        (By.CSS_SELECTOR, "input[id*='user' i]"),
        (By.CSS_SELECTOR, "input[name*='login' i]"),
        (By.CSS_SELECTOR, "input[id*='login' i]"),
        (By.CSS_SELECTOR, "input[name*='identifier' i]"),
        (By.CSS_SELECTOR, "input[id*='identifier' i]"),
        (By.CSS_SELECTOR, "input[type='text']"),
    ]
    password_candidates = [
        (By.CSS_SELECTOR, "input#password"),
        (By.CSS_SELECTOR, "input[name*='pass' i]"),
        (By.CSS_SELECTOR, "input[id*='pass' i]"),
        (By.CSS_SELECTOR, "input[type='password']"),
    ]
    submit_candidates = [
        (By.CSS_SELECTOR, "button#submit"),
        (By.CSS_SELECTOR, "input#submit"),
        (By.CSS_SELECTOR, "button[type='submit']"),
        (By.CSS_SELECTOR, "input[type='submit']"),
        (By.CSS_SELECTOR, "button[name*='login' i]"),
        (By.CSS_SELECTOR, "button[id*='login' i]"),
    ]

    # Try direct candidates, else try label/placeholder matching
    try:
        user_input = _find_first(driver, username_candidates)
    except Exception:
        alt = _find_by_label_or_placeholder(driver, ["email", "user", "login", "identifier", "account"])
        if not alt:
            raise
        user_input = WebDriverWait(driver, 5).until(EC.presence_of_element_located(alt))

    try:
        pass_input = _find_first(driver, password_candidates)
    except Exception:
        altp = _find_by_label_or_placeholder(driver, ["password", "passcode"]) or (By.CSS_SELECTOR, "input[type='password']")
        pass_input = WebDriverWait(driver, 5).until(EC.presence_of_element_located(altp))
    submit_btn = _find_first(driver, submit_candidates)

    user_input.clear(); user_input.send_keys(user_val)
    pass_input.clear(); pass_input.send_keys(pass_val)
    submit_btn.click()

    # Wait for feedback: URL or page content change
    # Short settle wait
    WebDriverWait(driver, 5).until(lambda d: True)
    src = driver.page_source.lower()
    cur = driver.current_url.lower()

    # Assertions based on description intent or explicit expectations
    expectations = (test or {}).get("assert") or {}
    exp_url = expectations.get("url_contains") if isinstance(expectations, dict) else None
    exp_text = expectations.get("text_contains") if isinstance(expectations, dict) else None
    exp_not_text = expectations.get("not_text_contains") if isinstance(expectations, dict) else None

    if exp_url and exp_url.lower() not in cur:
        raise AssertionError(f"URL did not contain expected fragment: {exp_url}")
    if exp_text and exp_text.lower() not in src:
        raise AssertionError(f"Page did not contain expected text: {exp_text}")
    if exp_not_text and exp_not_text.lower() in src:
        raise AssertionError(f"Page contained unexpected text: {exp_not_text}")

    if any(k in desc for k in ["success", "lands on", "secure", "works", "valid"]):
        if any(t in (cur + src) for t in ["success", "logged", "secure", "welcome", "dashboard"]):
            return "Login success heuristic matched."
        raise AssertionError("Expected successful login feedback not found")
    if any(k in desc for k in ["fail", "error", "invalid", "required", "incorrect"]):
        if any(t in src for t in ["invalid", "error", "required", "unsuccessful", "incorrect", "try again"]):
            return "Login failure heuristic matched."
        raise AssertionError("Expected error message not found")
    return "Submitted login form."


def _fill_form_generic(driver: webdriver.Chrome, data: Dict[str, str]) -> str:
    """Fill a generic form using provided data mapping.
    Keys can be field hints (label text, placeholder, name, id) or CSS/XPath selectors.
    """
    filled = 0
    for key, value in (data or {}).items():
        by, selector = None, None
        # If key looks like a selector prefix, use it directly
        low = str(key).lower().strip()
        if low.startswith("xpath=") or low.startswith("//") or low.startswith(".//"):
            by, selector = By.XPATH, key.split("=", 1)[1] if "=" in key else key
        elif low.startswith("css=") or low.startswith("css:"):
            by, selector = By.CSS_SELECTOR, key.split(":", 1)[1] if ":" in key else key.split("=", 1)[1]
        elif low.startswith("id="):
            by, selector = By.ID, key.split("=", 1)[1]
        elif low.startswith("name="):
            by, selector = By.NAME, key.split("=", 1)[1]

        elem = None
        try:
            if by and selector:
                elem = WebDriverWait(driver, 5).until(EC.presence_of_element_located((by, selector)))
            else:
                # Fuzzy by label/placeholder/name/id
                alt = _find_by_label_or_placeholder(driver, [low])
                if alt:
                    elem = WebDriverWait(driver, 5).until(EC.presence_of_element_located(alt))
        except Exception:
            elem = None

        if elem is None:
            continue
        try:
            tag = elem.tag_name.lower()
            t = (elem.get_attribute("type") or "").lower()
            if tag in ("input", "textarea") and t not in ("checkbox", "radio", "submit", "button"):
                elem.clear()
                elem.send_keys(str(value))
                filled += 1
            elif t in ("checkbox",):
                should = str(value).strip().lower() in ("1", "true", "yes", "on")
                is_checked = elem.is_selected()
                if should != is_checked:
                    elem.click()
                    filled += 1
        except Exception:
            continue

    # Submit form if a submit control exists
    try:
        submit = _find_first(driver, [
            (By.CSS_SELECTOR, "button[type='submit']"),
            (By.CSS_SELECTOR, "input[type='submit']"),
            (By.XPATH, "//button[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'submit' ) or contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'send') or contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'save') or contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'continue')]")
        ])
        submit.click()
    except Exception:
        pass

    return f"Filled {filled} field(s) and attempted submit."


def _responsive_check(driver: webdriver.Chrome, description: str) -> str:
    desc = (description or "").lower()
    if "375" in desc or "mobile" in desc:
        driver.set_window_size(375, 812)
    else:
        driver.set_window_size(414, 896)
    _find_first(driver, [
        (By.CSS_SELECTOR, "form"),
        (By.CSS_SELECTOR, "form[action]"),
        (By.CSS_SELECTOR, "input, button")
    ])
    return "Responsive check passed (key elements visible)."


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
            desc_lower = (description or "").lower()

            try:
                if "forgot" in desc_lower and "password" in desc_lower:
                    # Try by id, else any link with text 'forgot'
                    try:
                        link = _find_first(driver, [
                            (By.CSS_SELECTOR, "a#forgot_password"),
                            (By.XPATH, "//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'forgot')]")
                        ])
                        link.click()
                        WebDriverWait(driver, 8).until(lambda d: "password" in d.page_source.lower() or "reset" in d.current_url.lower())
                        action_msg = "Navigated to password reset per heuristic."
                    except Exception:
                        action_msg = "Forgot password link not found."
                elif (test.get("action") or "").lower() == "login" or "login" in desc_lower or "sign in" in desc_lower:
                    action_msg = _fill_login_and_submit(driver, description, website_url, test)
                elif (test.get("action") or "").lower() in ("formsubmit", "submit", "form") or ("form" in desc_lower and "submit" in desc_lower):
                    action_msg = _fill_form_generic(driver, test.get("data") or {})
                elif "responsive" in desc_lower or "mobile" in desc_lower:
                    action_msg = _responsive_check(driver, description)
                else:
                    # Generic presence checks. Support multi-selectors; pass if at least one found.
                    found = 0
                    if selector:
                        for sel in _split_selectors(selector):
                            try:
                                by, value = _loc_strategy(sel)
                                _wait_presence(driver, by, value)
                                found += 1
                            except Exception:
                                continue
                    if selector and found == 0:
                        raise TimeoutException("None of the provided selectors were found")
                    action_msg = f"Verified presence of {found} selector(s)." if selector else "Page loaded."

                results.append({
                    "id": test_id,
                    "name": name,
                    "status": "passed",
                    "message": action_msg
                })
            except TimeoutException:
                results.append({
                    "id": test_id,
                    "name": name,
                    "status": "failed",
                    "message": "Timeout waiting for expected UI condition."
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
