'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

type SupportedFormats = 'ascii' | 'latex' | 'markdown';
export interface TreeItemMask {
  default: string;
  first?: string;
  last?: string;
}
export interface TreeConfig {
  picker: vscode.QuickPickItem;
  beforeTree?: string;
  afterTree?: string;
  indent: string;
  basePath?: string;
  masks: {
    root: string;
    file: TreeItemMask;
    directory: TreeItemMask;
  };
}

export function activate(ctx: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('extension.fileTreeToText', async (startDir) => {
    const defaultConfig = vscode.workspace.getConfiguration().get('tree-generator.targets') as TreeConfig[];
    const pickerItems = defaultConfig.map(el => el.picker);
    let maxDepth = vscode.workspace.getConfiguration().get('tree-generator.defaultDepth') as Number;
    let defaultTarget = vscode.workspace.getConfiguration().get('tree-generator.defaultTarget') as String;
    let selected = pickerItems.find(el => el.label === defaultTarget);
    const promptUser = vscode.workspace.getConfiguration().get('tree-generator.prompt') as Boolean;

    if (promptUser) {
      selected = await vscode.window.showQuickPick(pickerItems);
      const depth = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        prompt: 'Select the max depth of the tree',
        value: maxDepth.toString(),
        validateInput(value) {
          return (Number(value) && Number(value) > 0 || !value) ? null : 'Please enter a valid number greater then 0 or leave the input empty';
        }
      });
      maxDepth = Number(depth);
    }

    // tree root item
    let tree = '';

    // ASCII Tree
    if (selected && selected.label) {
      const searchLabel = selected.label;
      const match = defaultConfig.find(el => el.picker.label === searchLabel);
      if (match) {
        const basePathBeforeSelection = path.dirname(startDir.fsPath);
        const treeRef = new Tree({
          ...match,
          basePath: basePathBeforeSelection
        });
        tree = treeRef.getTree(startDir.fsPath, Number(maxDepth));
      }
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
}

export function deactivate() {}

/**
 * Create the class by handing over the tree configuration
 */
export class Tree {
  private maxDepth: number | undefined;

  /**
   * Create the class by handing over the tree configuration
   * @param config The configuration for tree creation
   */
  constructor(private config: TreeConfig) {}

  /**
   * Get the HTML output of the tree for a given path
   * @param selectedRootPath The path the user choose for tree generation
   * @param maxDepth The max depth of the generated tree.
   */
  public getTree(
    selectedRootPath: string,
    maxDepth?: number
  ) {
    this.maxDepth = maxDepth;
    const beforeTree = (this.config.beforeTree || '');
    const afterTree = (this.config.afterTree || '');
    const rootElement = this.convertElementToTargetFormat(
      1,
      path.basename(selectedRootPath),
      selectedRootPath,
      true,
      true,
      false,
      true
    );
    return beforeTree
      + rootElement
      + '<br/>'
      + this.generateTree(selectedRootPath, 0)
      + afterTree;
  }

  /**
   * Generate a tree or subtree for the given path and level
   * @param selectedRootPath The root from which the tree or subtree should be
   * generated
   * @param level The level from which the tree should be generated
   */
  private generateTree(selectedRootPath: string, level: number) {
    let textOutput = '';

    // return if path to target is not valid
    if (!fs.existsSync(selectedRootPath)) { return ''; }

    // order by directory > file
    const beforSortFiles = fs.readdirSync(selectedRootPath);
    let paths: string[] = [];

    let tmp: string[] = [];
    beforSortFiles.forEach(el => {
      const fullPath = path.join(selectedRootPath, el.toString());
      if (fs.statSync(fullPath).isDirectory()) {
        paths.push(el);
      } else {
        tmp.push(el);
      }
    });
    paths = paths.concat(tmp);

    paths.forEach(el => {
      const fullPath = path.join(selectedRootPath, el.toString());
      const lastItem = paths.indexOf(el) === paths.length - 1;
      const firstItem = paths.indexOf(el) === 0;

      // add directories
      const textEl = this.convertElementToTargetFormat(
        level + 2,
        el.toString(),
        fullPath,
        fs.statSync(fullPath).isDirectory(),
        firstItem,
        lastItem
      );
      textOutput+= this.formatLevel(level, textEl);
      if (fs.statSync(fullPath).isDirectory()) {
        if (!this.maxDepth || level !== this.maxDepth - 1) {
          textOutput+= this.generateTree(fullPath, level + 1);
        }
      }
    });
    return textOutput;
  }

  /**
   * It will indent the element to the correct level
   * @param level the level of the element 
   * @param name the elements text
   */
  private formatLevel(level: number, name: string) {
    return `${Array(level + 1).join(this.config.indent)}${name}<br>`;
  }

  /**
   * This method will use the configured masks to bring the element into the
   * target format
   * @param level the level in the tree heirarchie
   * @param file the name of the file / directory
   * @param path the (full) path to the file or directory
   * @param isDirectory a flag to mark if the element is a directory
   * @param isFirst a flag to mark if the element is the first item in the block
   * @param isLast a flag to mark if the element is the last item in the block
   * @param isRoot a flag to mark if the element is the root element
   */
  private convertElementToTargetFormat(
    level: number,
    file: string,
    path: string,
    isDirectory = false,
    isFirst = false,
    isLast = false,
    isRoot = false
  ) {
    // cur first part of the path (before selected dir)
    if (this.config.basePath) {
      path = path.replace(this.config.basePath, '');
    }

    // select the correct mask config for type file or directory
    const maskConfig = isDirectory
      ? this.config.masks.directory
      : this.config.masks.file;
    
    // determine the correct mask from config
    let mask = '';
    if (this.config.masks.root && isRoot) {
      mask = this.config.masks.root;
    } else if (maskConfig.first && isFirst) {
      mask = maskConfig.first;
    } else if (maskConfig.last && isLast) {
      mask = maskConfig.last;
    } else {
      mask = maskConfig.default;
    }

    // build element string by using the mask
    return mask
      .replace('#0', level.toString())
      .replace('#1', file)
      .replace('#2', path);
  }
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
