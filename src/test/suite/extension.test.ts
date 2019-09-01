//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as vscode from 'vscode';
import * as ext from '../../extension';

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", function () {
  // Defines a Mocha unit test
  test("generate tree", function() {
    let result = ext.startTree(__dirname, 0);
    assert.equal(' ┣ <span class="t-icon" name="icons">📜</span>extension.test.js<br> ┣ <span class="t-icon" name="icons">📜</span>extension.test.js.map<br> ┣ <span class="t-icon" name="icons">📜</span>index.js<br> ┗ <span class="t-icon" name="icons">📜</span>index.js.map<br>', result);
  });
});
