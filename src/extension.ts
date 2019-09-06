'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const AvailableFormats: {[key: string]: vscode.QuickPickItem } = {
  ascii: {
    label: 'ASCII',
    description: 'Convert to ASCII Tree',
    picked: true,
  },
  latex: {
    label: 'LaTeX',
    description: 'Convert to LaTeX (DirTree)',
  },
  markdown: {
    label: 'Markdown',
    description: 'Convert to Markdown',
  }
};

export function activate(ctx: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('extension.fileTreeToText', (startDir) => {
    vscode.window.showQuickPick(Object.values(AvailableFormats)).then((selected) => {
      const defaultVal = 5;
      vscode.window.showInputBox({
        ignoreFocusOut: true,
        prompt: 'Select the max depth of the tree',
        value: defaultVal.toString(),
        validateInput(value) {
          return (Number(value) && Number(value) > 0 || !value) ? null : 'Please enter a valid number greater then 0 or leave the input empty';
        }
      }).then((maxDepth) => {
        // tree root item
        let tree = '';

        // ASCII Tree
        if (selected && selected.label === AvailableFormats.ascii.label) {
          tree += `${path.basename(startDir.fsPath)}/<br/>${asciiTree(startDir.fsPath, 0, Number(maxDepth))}`;
        }

        // LaTeX DirTree
        if (selected && selected.label === AvailableFormats.latex.label) {
          const pre = '\dirtree{%';
          const post = '}';
          tree += `${pre}<br/>  .1 ${path.basename(startDir.fsPath)}/<br/>${latexTree(startDir.fsPath, 0, Number(maxDepth))}${post}`;
        }

        // Markdown Tree
        if (selected && selected.label === AvailableFormats.markdown.label) {
          const basePathBeforeSelection = path.dirname(startDir.fsPath);
          tree += `# ${path.basename(startDir.fsPath)}<br/><br/>${markdownTree(startDir.fsPath, 0, Number(maxDepth), basePathBeforeSelection)}<br/>`;
        }

        const vscodeWebViewOutputTab = vscode.window.createWebviewPanel(
          'text',
          `${selected ? selected.label : ''} File Tree`,
          { viewColumn: vscode.ViewColumn.Active },
          { enableScripts: true }
        );
        // rerplace the target placeholder with the generated tree
        vscodeWebViewOutputTab.webview.html = baseTemplate.replace('###TEXTTOREPLACE###', tree);

        ctx.subscriptions.push(disposable);
      });
    });
  });
}

export function deactivate() {}

export function format(deps: number, pipe: string, name: string, indent = '┃ ') {
  return `${Array(deps + 1).join(indent)}${pipe}${name}<br>`;
}

// directory and file ditective function
export function asciiTree(targetPath: string, deps: number, maxDepth?: number) {
  let text = '';
  if (!fs.existsSync(targetPath)) { return ''; }

  // order by directory > file
  const beforSortFiles = fs.readdirSync(targetPath);
  let paths: string[] = [];

  let tmp: string[] = [];
  beforSortFiles.forEach(el => {
    const fullPath = path.join(targetPath, el.toString());
    if (fs.statSync(fullPath).isDirectory()) {
      paths.push(el);
    } else {
      tmp.push(el);
    }
  });
  paths = paths.concat(tmp);

  paths.forEach(el => {
    const fullPath = path.join(targetPath, el.toString());
    const pipe = paths.indexOf(el) === paths.length - 1 ? '┗ ' : '┣ ';

    // add directories
    if (fs.statSync(fullPath).isDirectory()) {
      text += format(
        deps,
        pipe,
        `${el.toString()}/`
      );
      if (!maxDepth) {
        text += asciiTree(fullPath, deps + 1);
      } else if(deps !== maxDepth - 1) {
        text += asciiTree(fullPath, deps + 1, maxDepth);
      }
    } else { // add files
      text += format(
        deps,
        pipe,
        `${el.toString()}`
      );
    }
  });
  return text;
}

// directory and file ditective function
export function latexTree(targetPath: string, deps: number, maxDepth?: number) {
  let text = '';
  if (!fs.existsSync(targetPath)) { return ''; }

  // order by directory > file
  const beforSortFiles = fs.readdirSync(targetPath);
  let paths: string[] = [];

  let tmp: string[] = [];
  beforSortFiles.forEach(el => {
    const fullPath = path.join(targetPath, el.toString());
    if (fs.statSync(fullPath).isDirectory()) {
      paths.push(el);
    } else {
      tmp.push(el);
    }
  });
  paths = paths.concat(tmp);

  paths.forEach(el => {
    const fullPath = path.join(targetPath, el.toString());
    const pipe = '  ';

    // add directories
    if (fs.statSync(fullPath).isDirectory()) {
      text += format(
        deps,
        pipe,
        `.${deps + 2} ${el.toString()}/ .`,
        ''
      );
      if (!maxDepth) {
        text += latexTree(fullPath, deps + 1);
      } else if(deps !== maxDepth - 1) {
        text += latexTree(fullPath, deps + 1, maxDepth);
      }
    } else { // add files
      text += format(
        deps,
        pipe,
        `.${deps + 2} ${el.toString()} .`,
        ''
      );
    }
  });
  return text;
}

// directory and file ditective function
export function markdownTree(targetPath: string, deps: number, maxDepth?: number, cutPath = '') {
  let text = '';
  if (!fs.existsSync(targetPath)) { return ''; }

  // order by directory > file
  const beforSortFiles = fs.readdirSync(targetPath);
  let paths: string[] = [];

  let tmp: string[] = [];
  beforSortFiles.forEach(el => {
    const fullPath = path.join(targetPath, el.toString());
    if (fs.statSync(fullPath).isDirectory()) {
      paths.push(el);
    } else {
      tmp.push(el);
    }
  });
  paths = paths.concat(tmp);

  paths.forEach(el => {
    const fullPath = path.join(targetPath, el.toString());
    const pipe = '';

    // add directories
    if (fs.statSync(fullPath).isDirectory()) {
      text += format(
        deps,
        pipe,
        `* [${el.toString()}/](.${fullPath.replace(cutPath, '')})`,
        '  '
      );
      if (!maxDepth) {
        text += markdownTree(fullPath, deps + 1, undefined, cutPath);
      } else if(deps !== maxDepth - 1) {
        text += markdownTree(fullPath, deps + 1, maxDepth, cutPath);
      }
    } else { // add files
      text += format(
        deps,
        pipe,
        `* [${el.toString()}](.${fullPath.replace(cutPath, '')})`,
        '  '
      );
    }
  });
  return text;
}

const baseTemplate = `
<!DOCTYPE html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File Tree</title>
    <style>
      body.vscode-light {
        color: black;
      }

      body.vscode-dark {
        color: white;
      }

      body.vscode-high-contrast {
        color: red;
      }

      form.actions {
        padding-top: 20px;
      }

      .action-btn {
        color: var(--vscode-button-foreground);
        background-color: var(--vscode-button-background);
        border: none;
        width: auto;
        padding: 2px 14px;
        height: 30px;
        display: inline-block;
        font-size: 14px;
        font-weight: 400;
        line-height: 1.42857143;
        text-align: center;
        white-space: nowrap;
        vertical-align: middle;
        user-select:none;
        -moz-user-select: none;
        -webkit-user-select: none;
        -ms-user-select:none;
        -o-user-select:none;
      }

      .action-btn:hover {
        background-color: var(--vscode-button-hoverBackground);
      }
    </style>
  </head>

  <body>
    <!--<form class="form">
      <label>Icons:</label>
      <fieldset class="icons" id="icons">
        <input type="radio" id="icons-on" name="Icons on" value="true">
        <label for="icons-on"> Icons on</label>
        <input type="radio" id="icons-off" name="Icons off" value="false">
        <label for="icons-off"> Icons off</label>
      </fieldset>

      <label>Output format:</label>
      <fieldset class="output-format">
        <select name="format" id="format" size="5">
          <option value="ascii">ASCII</option>
          <option value="latex">LaTeX (DirTree)</option>
        </select>
      </fieldset>
    </form>-->
    <form class="actions">
      <button class="action-btn"
              tabindex="0" role="button"
              onclick="copyOutput()">
        Copy to clipboard
      </button>
    </form>

    <pre id="tree-output">###TEXTTOREPLACE###</pre>
  </body>

  <script>
  function copyOutput() {
    const containerid = 'tree-output';
    if (document.selection) {
      const range = document.body.createTextRange();
      range.moveToElementText(document.getElementById(containerid));
      range.select().createTextRange();
      document.execCommand("copy");
    } else if (window.getSelection) {
      const range = document.createRange();
      range.selectNode(document.getElementById(containerid));
      window.getSelection().addRange(range);
      document.execCommand("copy");
      window.getSelection().removeAllRanges();
    }
  }
  </script>
</html>
`;
