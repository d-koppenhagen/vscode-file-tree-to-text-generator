'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(ctx: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('extension.fileTreeToText', (startDir) => {
    // Display a Tree text
    const tree = `
${path.basename(startDir.fsPath)}
<br>
${startTree(startDir.fsPath, 0)}
      `;
    const vscodeWebViewOutputTab = vscode.window.createWebviewPanel(
      'text',
      'File Tree Text Output',
      { viewColumn: vscode.ViewColumn.Active },
      { enableScripts: true }
    );
    // rerplace the target placeholder with the generated tree
    vscodeWebViewOutputTab.webview.html = baseTemplate.replace('###TEXTTOREPLACE###', tree);
  });
  ctx.subscriptions.push(disposable);
}

export function deactivate() {}

export function format(deps: number, pipe: string, name: string) {
  return `${Array(deps + 1).join('┃ ')}${pipe}${name}<br>`;
}

// directory and file ditective function
export function startTree(targetPath: string, deps: number) {
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
        `${el.toString()}`
      );
      text += startTree(fullPath, deps + 1);
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

const baseTemplate = `
<html>
  <head>
    <style>
    </style>
  </head>

  <body>
    <pre id="tree-panel">
      ###TEXTTOREPLACE###
    </pre>
  </body>
</html>
`;
