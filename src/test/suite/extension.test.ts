//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// for creating example files and directories
import * as fs from 'fs-extra';
import * as path from 'path';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as vscode from 'vscode';
import { Tree } from '../../tree';

// Defines a Mocha test suite to group tests of similar kind together
suite('Extension Tests', () => {
  let testTree: Tree;
  const gernericTreeConfig = {
    picker: {
      label: 'Custom Tree',
      description: 'Convert to custom tree',
    },
    beforeTree: 'BEFORETREE<br/>',
    afterTree: 'AFTERTREE',
    indent: '┃ ',
    masks: {
      root: '# HEADING #0: #1 (#2)',
      file: {
        default: '+! #0: #1 (#2)',
        first: '+: #0: #1 (#2)',
        last: '+? #0: #1 (#2)',
      },
      directory: {
        default: '#! #0: #1 (#2)/',
        first: '#: #0: #1 (#2)/',
        last: '#? #0: #1 (#2)/',
      },
    },
    basePath: path.dirname(__dirname),
  };
  const filesAndDirs = [
    'l0f1.txt',
    'l0f2.txt',
    'l0f3.txt',
    'l1/l1f1.txt',
    'l1/l1f2.txt',
    'l1/l1f3.txt',
    'l1/l2/l2f1.txt',
    'l1/l2/l2f2.txt',
    'l1/l2/l2f3.txt',
    'l1/l2/l3/l4/l5/l5f1.txt',
    'l1/l2/l2f4.txt',
    'l0f4.txt',
    'A/B/C/1',
    'A/B/C/2',
    'A/B/C/3',
  ];

  setup(() => {
    filesAndDirs.forEach((file) => fs.ensureFileSync(path.resolve(__dirname, file)));
    testTree = new Tree(gernericTreeConfig);
  });

  test('generate a tree', () => {
    let result = testTree.getTree(__dirname);
    assert.strictEqual(
      'BEFORETREE<br/># HEADING 1: suite (/suite)<br/>#: 2: A (/suite/A)/<br/>┃ #? 3: B (/suite/A/B)/<br/>┃ ┃ #? 4: C (/suite/A/B/C)/<br/>┃ ┃ ┃ +: 5: 1 (/suite/A/B/C/1)<br/>┃ ┃ ┃ +! 5: 2 (/suite/A/B/C/2)<br/>┃ ┃ ┃ +? 5: 3 (/suite/A/B/C/3)<br/>#! 2: l1 (/suite/l1)/<br/>┃ #: 3: l2 (/suite/l1/l2)/<br/>┃ ┃ #: 4: l3 (/suite/l1/l2/l3)/<br/>┃ ┃ ┃ #? 5: l4 (/suite/l1/l2/l3/l4)/<br/>┃ ┃ ┃ ┃ #? 6: l5 (/suite/l1/l2/l3/l4/l5)/<br/>┃ ┃ ┃ ┃ ┃ +? 7: l5f1.txt (/suite/l1/l2/l3/l4/l5/l5f1.txt)<br/>┃ ┃ +! 4: l2f1.txt (/suite/l1/l2/l2f1.txt)<br/>┃ ┃ +! 4: l2f2.txt (/suite/l1/l2/l2f2.txt)<br/>┃ ┃ +! 4: l2f3.txt (/suite/l1/l2/l2f3.txt)<br/>┃ ┃ +? 4: l2f4.txt (/suite/l1/l2/l2f4.txt)<br/>┃ +! 3: l1f1.txt (/suite/l1/l1f1.txt)<br/>┃ +! 3: l1f2.txt (/suite/l1/l1f2.txt)<br/>┃ +? 3: l1f3.txt (/suite/l1/l1f3.txt)<br/>+! 2: extension.test.js (/suite/extension.test.js)<br/>+! 2: extension.test.js.map (/suite/extension.test.js.map)<br/>+! 2: index.js (/suite/index.js)<br/>+! 2: index.js.map (/suite/index.js.map)<br/>+! 2: l0f1.txt (/suite/l0f1.txt)<br/>+! 2: l0f2.txt (/suite/l0f2.txt)<br/>+! 2: l0f3.txt (/suite/l0f3.txt)<br/>+? 2: l0f4.txt (/suite/l0f4.txt)<br/>AFTERTREE',
      result,
    );
  });

  test('generate a tree and ignores glob patterns', () => {
    testTree = new Tree(gernericTreeConfig, ['**/l2f1.txt']);
    let result = testTree.getTree(__dirname);
    assert.strictEqual(
      'BEFORETREE<br/># HEADING 1: suite (/suite)<br/>#: 2: A (/suite/A)/<br/>┃ #? 3: B (/suite/A/B)/<br/>┃ ┃ #? 4: C (/suite/A/B/C)/<br/>┃ ┃ ┃ +: 5: 1 (/suite/A/B/C/1)<br/>┃ ┃ ┃ +! 5: 2 (/suite/A/B/C/2)<br/>┃ ┃ ┃ +? 5: 3 (/suite/A/B/C/3)<br/>#! 2: l1 (/suite/l1)/<br/>┃ #: 3: l2 (/suite/l1/l2)/<br/>┃ ┃ #: 4: l3 (/suite/l1/l2/l3)/<br/>┃ ┃ ┃ #? 5: l4 (/suite/l1/l2/l3/l4)/<br/>┃ ┃ ┃ ┃ #? 6: l5 (/suite/l1/l2/l3/l4/l5)/<br/>┃ ┃ ┃ ┃ ┃ +? 7: l5f1.txt (/suite/l1/l2/l3/l4/l5/l5f1.txt)<br/>┃ ┃ +! 4: l2f2.txt (/suite/l1/l2/l2f2.txt)<br/>┃ ┃ +! 4: l2f3.txt (/suite/l1/l2/l2f3.txt)<br/>┃ ┃ +? 4: l2f4.txt (/suite/l1/l2/l2f4.txt)<br/>┃ +! 3: l1f1.txt (/suite/l1/l1f1.txt)<br/>┃ +! 3: l1f2.txt (/suite/l1/l1f2.txt)<br/>┃ +? 3: l1f3.txt (/suite/l1/l1f3.txt)<br/>+! 2: extension.test.js (/suite/extension.test.js)<br/>+! 2: extension.test.js.map (/suite/extension.test.js.map)<br/>+! 2: index.js (/suite/index.js)<br/>+! 2: index.js.map (/suite/index.js.map)<br/>+! 2: l0f1.txt (/suite/l0f1.txt)<br/>+! 2: l0f2.txt (/suite/l0f2.txt)<br/>+! 2: l0f3.txt (/suite/l0f3.txt)<br/>+? 2: l0f4.txt (/suite/l0f4.txt)<br/>AFTERTREE',
      result,
    );
  });

  test('generate a tree with maxDepth', () => {
    let result = testTree.getTree(__dirname, 2);
    assert.strictEqual(
      'BEFORETREE<br/># HEADING 1: suite (/suite)<br/>#: 2: A (/suite/A)/<br/>┃ #? 3: B (/suite/A/B)/<br/>#! 2: l1 (/suite/l1)/<br/>┃ #: 3: l2 (/suite/l1/l2)/<br/>┃ +! 3: l1f1.txt (/suite/l1/l1f1.txt)<br/>┃ +! 3: l1f2.txt (/suite/l1/l1f2.txt)<br/>┃ +? 3: l1f3.txt (/suite/l1/l1f3.txt)<br/>+! 2: extension.test.js (/suite/extension.test.js)<br/>+! 2: extension.test.js.map (/suite/extension.test.js.map)<br/>+! 2: index.js (/suite/index.js)<br/>+! 2: index.js.map (/suite/index.js.map)<br/>+! 2: l0f1.txt (/suite/l0f1.txt)<br/>+! 2: l0f2.txt (/suite/l0f2.txt)<br/>+! 2: l0f3.txt (/suite/l0f3.txt)<br/>+? 2: l0f4.txt (/suite/l0f4.txt)<br/>AFTERTREE',
      result,
    );
  });

  test('generate a tree only with directories', () => {
    testTree = new Tree({
      ...gernericTreeConfig,
      dirsOnly: true,
    });
    let result = testTree.getTree(__dirname);
    assert.strictEqual(
      'BEFORETREE<br/># HEADING 1: suite (/suite)<br/>#: 2: A (/suite/A)/<br/>┃ #? 3: B (/suite/A/B)/<br/>┃ ┃ #? 4: C (/suite/A/B/C)/<br/>#? 2: l1 (/suite/l1)/<br/>┃ #? 3: l2 (/suite/l1/l2)/<br/>┃ ┃ #? 4: l3 (/suite/l1/l2/l3)/<br/>┃ ┃ ┃ #? 5: l4 (/suite/l1/l2/l3/l4)/<br/>┃ ┃ ┃ ┃ #? 6: l5 (/suite/l1/l2/l3/l4/l5)/<br/>AFTERTREE',
      result,
    );
  });

  test('generate a tree only with limited directories per subtree', () => {
    let result = testTree.getTree(__dirname, undefined, undefined, 1);
    assert.strictEqual(
      'BEFORETREE<br/># HEADING 1: suite (/suite)<br/>#: 2: A (/suite/A)/<br/>┃ #? 3: B (/suite/A/B)/<br/>┃ ┃ #? 4: C (/suite/A/B/C)/<br/>┃ ┃ ┃ +: 5: 1 (/suite/A/B/C/1)<br/>┃ ┃ ┃ +! 5: 2 (/suite/A/B/C/2)<br/>┃ ┃ ┃ +? 5: 3 (/suite/A/B/C/3)<br/>+? 2: ... (...)<br/>+! 2: extension.test.js (/suite/extension.test.js)<br/>+! 2: extension.test.js.map (/suite/extension.test.js.map)<br/>+! 2: index.js (/suite/index.js)<br/>+! 2: index.js.map (/suite/index.js.map)<br/>+! 2: l0f1.txt (/suite/l0f1.txt)<br/>+! 2: l0f2.txt (/suite/l0f2.txt)<br/>+! 2: l0f3.txt (/suite/l0f3.txt)<br/>+? 2: l0f4.txt (/suite/l0f4.txt)<br/>AFTERTREE',
      result,
    );
  });

  test('generate a tree only with limited files per subtree', () => {
    let result = testTree.getTree(__dirname, undefined, 1);
    assert.strictEqual(
      'BEFORETREE<br/># HEADING 1: suite (/suite)<br/>#: 2: A (/suite/A)/<br/>┃ #? 3: B (/suite/A/B)/<br/>┃ ┃ #? 4: C (/suite/A/B/C)/<br/>┃ ┃ ┃ +: 5: 1 (/suite/A/B/C/1)<br/>┃ ┃ ┃ +? 5: ... (...)<br/>#! 2: l1 (/suite/l1)/<br/>┃ #: 3: l2 (/suite/l1/l2)/<br/>┃ ┃ #: 4: l3 (/suite/l1/l2/l3)/<br/>┃ ┃ ┃ #? 5: l4 (/suite/l1/l2/l3/l4)/<br/>┃ ┃ ┃ ┃ #? 6: l5 (/suite/l1/l2/l3/l4/l5)/<br/>┃ ┃ ┃ ┃ ┃ +? 7: l5f1.txt (/suite/l1/l2/l3/l4/l5/l5f1.txt)<br/>┃ ┃ +! 4: l2f1.txt (/suite/l1/l2/l2f1.txt)<br/>┃ ┃ +? 4: ... (...)<br/>┃ +! 3: l1f1.txt (/suite/l1/l1f1.txt)<br/>┃ +? 3: ... (...)<br/>+! 2: extension.test.js (/suite/extension.test.js)<br/>+? 2: ... (...)<br/>AFTERTREE',
      result,
    );
  });

  test('generate respect indentParentDirIsLast', () => {
    testTree = new Tree({
      ...gernericTreeConfig,
      indentParentDirIsLast: '>>',
    });
    let result = testTree.getTree(__dirname, undefined, 1);
    assert.strictEqual(
      'BEFORETREE<br/># HEADING 1: suite (/suite)<br/>#: 2: A (/suite/A)/<br/>┃ #? 3: B (/suite/A/B)/<br/>┃ >>#? 4: C (/suite/A/B/C)/<br/>┃ ┃ >>+: 5: 1 (/suite/A/B/C/1)<br/>┃ ┃ >>+? 5: ... (...)<br/>#! 2: l1 (/suite/l1)/<br/>┃ #: 3: l2 (/suite/l1/l2)/<br/>┃ ┃ #: 4: l3 (/suite/l1/l2/l3)/<br/>┃ ┃ ┃ #? 5: l4 (/suite/l1/l2/l3/l4)/<br/>┃ ┃ ┃ >>#? 6: l5 (/suite/l1/l2/l3/l4/l5)/<br/>┃ ┃ ┃ ┃ >>+? 7: l5f1.txt (/suite/l1/l2/l3/l4/l5/l5f1.txt)<br/>┃ ┃ +! 4: l2f1.txt (/suite/l1/l2/l2f1.txt)<br/>┃ ┃ +? 4: ... (...)<br/>┃ +! 3: l1f1.txt (/suite/l1/l1f1.txt)<br/>┃ +? 3: ... (...)<br/>+! 2: extension.test.js (/suite/extension.test.js)<br/>+? 2: ... (...)<br/>AFTERTREE',
      result,
    );
  });
});
