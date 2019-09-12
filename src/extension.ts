'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Configure the masks for tree items
 * Use the placeholders #0, #1 amd #2 which will be replaces as with the
 * following content:
 * #0 : Insert the tree level number
 * #1 : Insert the name of the file or directory
 * #2 : Insert the relative path to the file or directory starting from the selected directory
 * @example
 * - #0: [#1](.#2)
 * - 1: [file1.txt](./path/to/file/file1.txt)
 */
export interface TreeItemMask {
  /** Set the default mask for the tree or subtree  */
  default: string;
  /** Set the mask for the first item in a tree or subtree  */
  first?: string;
  /** Set the mask for the last item in a tree or subtree  */
  last?: string;
}

/**
 * This interface describes the tree configuration and it matches with the
 * settings defined in the `settings.json` file
 */
export interface TreeConfig {
  /** The QuickPicker configuration for the user prompt */
  picker: vscode.QuickPickItem;
  /** Define a text (HTML) which will be added before the tree items */
  beforeTree?: string;
  /** Define a text (HTML) which will be added after the tree items */
  afterTree?: string;
  /** Set a string for indent per level of the tree */
  indent: string;
  /** Set a string of the basepath wich will be cut from the full path */
  basePath?: string;
  /** Configure the masks for tree items */
  masks: {
    /** The mask for the first (root) item */
    root: string;
    /** Configure the masks for file tree items */
    file: TreeItemMask;
    /** Configure the masks for directory tree items */
    directory: TreeItemMask;
  };
  /** Ignore files and just print dirs */
  dirsOnly?: boolean;
}

export function activate(ctx: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('extension.fileTreeToText', async (startDir) => {
    // get configuration from `settings.json`
    const defaultConfig = vscode.workspace.getConfiguration().get('tree-generator.targets') as TreeConfig[];
    const pickerItems = defaultConfig.map(el => el.picker);
    let maxDepth = vscode.workspace.getConfiguration().get('tree-generator.defaultDepth') as number;
    let defaultTarget = vscode.workspace.getConfiguration().get('tree-generator.defaultTarget') as string;
    let selected = pickerItems.find(el => el.label === defaultTarget);
    const promptUser = vscode.workspace.getConfiguration().get('tree-generator.prompt') as boolean;
    const dirsOnly = vscode.workspace.getConfiguration().get('tree-generator.dirsOnly') as boolean;

    // handle user prompt interaction
    if (promptUser) {
      selected = await vscode.window.showQuickPick(pickerItems);
      const depth = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        prompt: 'Select the max depth of the tree',
        value: maxDepth.toString(),
        validateInput(value) {
          return (Number(value) && Number(value) > 0 || !value)
            ? null
            : 'Please enter a valid number greater then 0 or leave the input empty';
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
          basePath: basePathBeforeSelection,
          dirsOnly
        });
        tree = treeRef.getTree(startDir.fsPath, Number(maxDepth));
      }
    }

    // initialize new web tab
    const vscodeWebViewOutputTab = vscode.window.createWebviewPanel(
      'text',
      `${selected ? selected.label : ''} File Tree`,
      { viewColumn: vscode.ViewColumn.Active },
      { enableScripts: true }
    );

    // replace the target placeholder with the generated tree
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
    let pathsArray: string[] = [];

    let filesArray: string[] = [];
    beforSortFiles.forEach(el => {
      const fullPath = path.join(selectedRootPath, el.toString());
      if (fs.statSync(fullPath).isDirectory()) {
        pathsArray.push(el);
      } else {
        if (!this.config.dirsOnly) {
          filesArray.push(el);
        }
      }
    });
    const pathsAndFilesArray = [...pathsArray, ...filesArray];

    pathsAndFilesArray.forEach(el => {
      const fullPath = path.join(selectedRootPath, el.toString());
      const lastItem = pathsAndFilesArray.indexOf(el) === pathsAndFilesArray.length - 1;
      const firstItem = pathsAndFilesArray.indexOf(el) === 0;

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
    return `${Array(level + 1).join(this.config.indent)}${name}<br/>`;
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
    } else if (maskConfig.last && isLast) {
      mask = maskConfig.last;
    } else if (maskConfig.first && isFirst) {
      mask = maskConfig.first;
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

/**
 * defines the HTML template for the tab in which the tree result is inserted
 */
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
