import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173/devtools/code")
        page.wait_for_timeout(2000)

        # Take screenshot of the initial UI
        page.screenshot(path="devtools_code_ui.png", full_page=True)
        print("Screenshot saved to devtools_code_ui.png")

        browser.close()

if __name__ == "__main__":
    run()
