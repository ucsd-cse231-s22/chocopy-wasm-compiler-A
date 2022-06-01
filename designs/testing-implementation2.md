Testing
===
# Testing Implementation phase 2
## Change of files
#### .github/workflows/main.yml
Add browserTest on macOS in Chrome server
#### tests/bignum-test.test.ts
Comment out the bignum-test because the autograder is reported error sometimes because of this(Observe this pattern in both Window and Ubuntu).
#### package.json
Add "npm run test-browser" to script and incluede the needed package(chromedriver and selenium-webdriver).
#### tests/integrated.test.ts
Added 120 test cases for integration testing in Python . Most of them are the combination of two features. Some of them possess functions that haven't been implemented or not yet been merged(such as writing string to file), developers won't need to pass all of them.
#### browsertests/browser.test.ts
Implement some testing helper function in here whose parameters and names are aligned in the original test framework(e.g. assertPrint, assertTCFail), and implement some testing helper functions that do not exist in the original testing framework(e.g. assertRepl to test for repl in the webpage).
#### browsertests/{}.test.ts
Transplant some tests in the original tests into browsertests.

Below is the demo of the automation browsertest(uncomment line 17 in browserTests/browser.test.ts can make the window popup). Besides, the number of test cases are reduced in the demo GIF for the demo purpose.


![](https://i.imgur.com/bqYBEWO.gif)
