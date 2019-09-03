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
suite('Extension Tests', () => {
  // Defines a Mocha unit test
  test('generate ascii tree', () => {
    let result = ext.asciiTree(__dirname, 0);
    assert.equal('┣ extension.test.js<br>┣ extension.test.js.map<br>┣ index.js<br>┗ index.js.map<br>', result);
  });

  test('generate latex tree', () => {
    let result = ext.latexTree(__dirname, 0);
    assert.equal('  .2 extension.test.js .<br>  .2 extension.test.js.map .<br>  .2 index.js .<br>  .2 index.js.map .<br>', result);
  });

  test('generate markdown tree', () => {
    let result = ext.markdownTree(__dirname, 0);
    assert.equal('* [extension.test.js](./Users/dannykoppenhagen/dev/file-tree-to-text-generator/out/test/suite/extension.test.js)<br>* [extension.test.js.map](./Users/dannykoppenhagen/dev/file-tree-to-text-generator/out/test/suite/extension.test.js.map)<br>* [index.js](./Users/dannykoppenhagen/dev/file-tree-to-text-generator/out/test/suite/index.js)<br>* [index.js.map](./Users/dannykoppenhagen/dev/file-tree-to-text-generator/out/test/suite/index.js.map)<br>', result);
  });

  test('format an enty', () => {
    let result = ext.format(3, 'ABCD', 'testEl', '*+#');
    assert.equal('*+#*+#*+#ABCDtestEl<br>', result);
  });
});
