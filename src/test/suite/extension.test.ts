//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// for creating exaple files and directories
import * as fs from 'fs-extra';
import * as path from 'path';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as vscode from 'vscode';
import * as ext from '../../extension';

// Defines a Mocha test suite to group tests of similar kind together
suite('Extension Tests', () => {
  setup(() => {
    const exampleFile = path.resolve(__dirname, 'tree/level1/level2/level3/file.txt');
    fs.ensureFileSync(exampleFile); // create example dirTree
  });

  /*
  test('generate ascii tree', () => {
    let result = ext.asciiTree(__dirname, 0);
    assert.equal('┣ tree/<br>┃ ┗ level1/<br>┃ ┃ ┗ level2/<br>┃ ┃ ┃ ┗ level3/<br>┃ ┃ ┃ ┃ ┗ file.txt<br>┣ extension.test.js<br>┣ extension.test.js.map<br>┣ index.js<br>┗ index.js.map<br>', result);
  });

  test('generate ascii tree limited to level 2', () => {
    let result = ext.asciiTree(__dirname, 0, 1);
    assert.equal('┣ tree/<br>┣ extension.test.js<br>┣ extension.test.js.map<br>┣ index.js<br>┗ index.js.map<br>', result);
  });

  test('generate latex tree', () => {
    let result = ext.latexTree(__dirname, 0);
    assert.equal('  .2 tree/ .<br>  .3 level1/ .<br>  .4 level2/ .<br>  .5 level3/ .<br>  .6 file.txt .<br>  .2 extension.test.js .<br>  .2 extension.test.js.map .<br>  .2 index.js .<br>  .2 index.js.map .<br>', result);
  });

  test('generate latex tree limited to level 2', () => {
    let result = ext.latexTree(__dirname, 0, 1);
    assert.equal('  .2 tree/ .<br>  .2 extension.test.js .<br>  .2 extension.test.js.map .<br>  .2 index.js .<br>  .2 index.js.map .<br>', result);
  });

  test('generate markdown tree', () => {
    let result = ext.markdownTree(__dirname, 0);
    assert.equal(`* [tree/](.${__dirname}/tree)<br>  * [level1/](.${__dirname}/tree/level1)<br>    * [level2/](.${__dirname}/tree/level1/level2)<br>      * [level3/](.${__dirname}/tree/level1/level2/level3)<br>        * [file.txt](.${__dirname}/tree/level1/level2/level3/file.txt)<br>* [extension.test.js](.${__dirname}/extension.test.js)<br>* [extension.test.js.map](.${__dirname}/extension.test.js.map)<br>* [index.js](.${__dirname}/index.js)<br>* [index.js.map](.${__dirname}/index.js.map)<br>`, result);
  });

  test('generate markdown tree limited to level 2', () => {
    let result = ext.markdownTree(__dirname, 0, 1);
    assert.equal(`* [tree/](.${__dirname}/tree)<br>* [extension.test.js](.${__dirname}/extension.test.js)<br>* [extension.test.js.map](.${__dirname}/extension.test.js.map)<br>* [index.js](.${__dirname}/index.js)<br>* [index.js.map](.${__dirname}/index.js.map)<br>`, result);
  });

  test('format an enty', () => {
    let result = ext.format(3, 'ABCD', 'testEl', '*+#');
    assert.equal('*+#*+#*+#ABCDtestEl<br>', result);
  });
  */
});
