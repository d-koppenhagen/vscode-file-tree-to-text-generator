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
  /**
   * Set a string for indent which is used prefered if set and if the parent
   * element is the last in it's subtree (not further siblings).
   * @example
   * ┃ ┃ ┃ ┗ imgage.jpg // indent, indent, mask:last
   * ┃ ┃ ┗ text/        // indent, indent, mask:last
   * ┃ ┃   ┣ file.txt   // indent, indent, indentParentDirIsLast, mask:default
   * ┃ ┃   ┣ file2.txt  // indent, indent, indentParentDirIsLast, mask:default
   * ┃ ┃   ┗ file3.txt  // indent, indent, indentParentDirIsLast, mask:last
   * ┃ ┣ css/           // indent, mask:default
   * ┃ ┃ ┗ style.css    // indent, indent, mask:last
   */
  indentParentDirIsLast?: string;
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
  const disposable = vscode.commands.registerCommand(
    'extension.fileTreeToText',
    async startDir => {
      // get configuration from `settings.json`
      const defaultConfig = vscode.workspace
        .getConfiguration()
        .get('tree-generator.targets') as TreeConfig[];
      const pickerItems = defaultConfig.map(el => el.picker);
      let maxDepth = vscode.workspace
        .getConfiguration()
        .get('tree-generator.defaultDepth') as number;
      const maxFilesPerSubtree = vscode.workspace
        .getConfiguration()
        .get('tree-generator.maxFilesInSubtree') as number;
      const maxDirsPerSubtree = vscode.workspace
        .getConfiguration()
        .get('tree-generator.maxDirsInSubtree') as number;
      let defaultTarget = vscode.workspace
        .getConfiguration()
        .get('tree-generator.defaultTarget') as string;
      let selected = pickerItems.find(el => el.label === defaultTarget);
      const promptUser = vscode.workspace
        .getConfiguration()
        .get('tree-generator.prompt') as boolean;
      const dirsOnly = vscode.workspace
        .getConfiguration()
        .get('tree-generator.dirsOnly') as boolean;

      // handle user prompt interaction
      if (promptUser) {
        selected = await vscode.window.showQuickPick(pickerItems);
        const depth = await vscode.window.showInputBox({
          ignoreFocusOut: true,
          prompt: 'Select the max depth of the tree',
          value: maxDepth.toString(),
          validateInput(value: string) {
            return (Number(value) && Number(value) > 0) || !value
              ? null
              : 'Please enter a valid number greater then 0 or leave the input empty';
          },
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
            dirsOnly,
          });
          tree = treeRef.getTree(
            startDir.fsPath,
            Number(maxDepth),
            Number(maxFilesPerSubtree),
            Number(maxDirsPerSubtree)
          );
        }
      }

      // initialize new web tab
      const vscodeWebViewOutputTab = vscode.window.createWebviewPanel(
        'text',
        `${selected ? selected.label : ''} File Tree`,
        { viewColumn: vscode.ViewColumn.Active },
        { enableScripts: true }
      );

      const pathToHtml = vscode.Uri.file(
        path.join(ctx.extensionPath, 'src', 'webview.html')
      );

      const pathUri = pathToHtml.with({ scheme: 'vscode-resource' });

      vscodeWebViewOutputTab.webview.html = fs
        .readFileSync(pathUri.fsPath, 'utf8')
        .replace('###TEXTTOREPLACE###', tree);

      ctx.subscriptions.push(disposable);
    }
  );
}

/**
 * function that'll run when plugin will be deactivated
 */
export function deactivate() {}

/**
 * Create the class by handing over the tree configuration
 */
export class Tree {
  /**
   * limit the depth of the tree
   */
  private maxDepth: number | undefined;
  /**
   * limit the amaount of directories in  a subtree
   */
  private maxDirsPerSubtree: number | undefined;
  /**
   * limit the amaount of files in  a subtree
   */
  private maxFilesInSubtree: number | undefined;

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
    maxDepth?: number,
    maxFilesInSubtree?: number,
    maxDirsPerSubtree?: number
  ) {
    this.maxDepth = maxDepth;
    this.maxDirsPerSubtree = maxDirsPerSubtree;
    this.maxFilesInSubtree = maxFilesInSubtree;
    const beforeTree = this.config.beforeTree || '';
    const afterTree = this.config.afterTree || '';
    const rootElement = this.convertElementToTargetFormat(
      1,
      path.basename(selectedRootPath),
      selectedRootPath,
      true,
      true,
      false,
      true
    );
    return (
      beforeTree +
      rootElement +
      '<br/>' +
      this.generateTree(selectedRootPath, 0) +
      afterTree
    );
  }

  /**
   * Generate a tree or subtree for the given path and level
   * @param selectedRootPath The root from which the tree or subtree should be
   * generated
   * @param level The level from which the tree should be generated
   */
  private generateTree(
    selectedRootPath: string,
    level: number,
    parentDirIsLast = false
  ) {
    let textOutput = '';

    // return if path to target is not valid
    if (!fs.existsSync(selectedRootPath)) {
      return '';
    }

    // order by directory > file
    const beforSortFiles = fs.readdirSync(selectedRootPath);
    let dirsArray: string[] = [];

    let filesArray: string[] = [];
    beforSortFiles.forEach(el => {
      const fullPath = path.join(selectedRootPath, el.toString());
      if (fs.statSync(fullPath).isDirectory()) {
        dirsArray.push(el);
      } else {
        if (!this.config.dirsOnly) {
          filesArray.push(el);
        }
      }
    });

    const maxReachedString = '...';
    const countDirsInSubtree = dirsArray.length;
    if (this.maxDirsPerSubtree && countDirsInSubtree > this.maxDirsPerSubtree) {
      dirsArray = dirsArray.slice(0, this.maxDirsPerSubtree);
      dirsArray.push(maxReachedString);
    }

    const countFilesInSubtree = filesArray.length;
    if (
      this.maxFilesInSubtree &&
      countFilesInSubtree > this.maxFilesInSubtree
    ) {
      filesArray = filesArray.slice(0, this.maxFilesInSubtree);
      filesArray.push(maxReachedString);
    }

    const pathsAndFilesArray = [...dirsArray, ...filesArray];

    pathsAndFilesArray.forEach(el => {
      const isLimitPlaceholder = el === maxReachedString;

      const elText = isLimitPlaceholder ? maxReachedString : el.toString();
      const fullPath = isLimitPlaceholder
        ? maxReachedString
        : path.join(selectedRootPath, el.toString());
      const lastItem = isLimitPlaceholder
        ? true
        : pathsAndFilesArray.indexOf(el) === pathsAndFilesArray.length - 1;
      const firstItem = isLimitPlaceholder
        ? false
        : pathsAndFilesArray.indexOf(el) === 0;
      const isDirectory = isLimitPlaceholder
        ? false
        : fs.statSync(fullPath).isDirectory();
      const isLastDirInTree = isDirectory && lastItem;

      // add directories
      const textEl = this.convertElementToTargetFormat(
        level + 2,
        elText,
        fullPath,
        isDirectory,
        firstItem,
        lastItem
      );
      textOutput += this.formatLevel(level, textEl, parentDirIsLast);
      if (isDirectory && (!this.maxDepth || level !== this.maxDepth - 1)) {
        textOutput += this.generateTree(fullPath, level + 1, isLastDirInTree);
      }
    });
    return textOutput;
  }

  /**
   * It will indent the element to the correct level
   * @param level the level of the element
   * @param name the elements text
   */
  private formatLevel(level: number, name: string, parentDirIsLast = false) {
    const fullIndentString =
      parentDirIsLast && this.config.indentParentDirIsLast
        ? Array(level).join(this.config.indent) +
          this.config.indentParentDirIsLast
        : Array(level + 1).join(this.config.indent);
    return `${fullIndentString}${name}<br/>`;
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
