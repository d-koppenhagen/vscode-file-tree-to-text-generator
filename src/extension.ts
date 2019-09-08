'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

type SupportedFormats = 'ascii' | 'latex' | 'markdown';

const AvailableFormats: {[key in SupportedFormats]: vscode.QuickPickItem } = {
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

const defaultConfig: {[key: string]: TreeConfig} = {
  ascii: {
    beforeTree: '',
    afterTree: '',
    indent: '┃ ',
    masks: {
      root: '#1/',
      file: {
        default: '┣ #1',
        last: '┗ #1'
      },
      directory: {
        default: '┣ #1/'
      },
    }
  },
  latex: {
    beforeTree: '\dirtree{%<br/>',
    afterTree: '}',
    indent: '',
    masks: {
      root: '. #0 #1 .',
      file: {
        default: '. #0 #1 .'
      },
      directory: {
        default: '. #0 #1/ .'
      },
    }
  },
  markdown: {
    beforeTree: '',
    afterTree: '<br/>',
    indent: '  ',
    masks: {
      root: '# #1<br/>',
      file: {
        default: '[#1](.#2)'
      },
      directory: {
        default: '[#1/](.#2)'
      },
    }
  }
};

export function activate(ctx: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('extension.fileTreeToText', async (startDir) => {
    let maxDepth = vscode.workspace.getConfiguration().get('tree-generator.defaultDepth') as Number;
    let defaultTarget = vscode.workspace.getConfiguration().get('tree-generator.defaultTarget') as String;
    let selected = Object.values(AvailableFormats).find(el => el.label === defaultTarget);
    const promptUser = vscode.workspace.getConfiguration().get('tree-generator.prompt') as Boolean;

    if (promptUser) {
      selected = await vscode.window.showQuickPick(Object.values(AvailableFormats));
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
    if (selected && selected.label === AvailableFormats.ascii.label) {
      // tree += `${path.basename(startDir.fsPath)}/<br/>${asciiTree(startDir.fsPath, 0, Number(maxDepth))}`;
      const treeRef = new Tree(defaultConfig.ascii);
      tree = treeRef.getTree(startDir.fsPath, 0, Number(maxDepth));
    }

    // LaTeX DirTree
    if (selected && selected.label === AvailableFormats.latex.label) {
      const treeRef = new Tree(defaultConfig.latex, 1, 2);
      tree = treeRef.getTree(startDir.fsPath, 0, Number(maxDepth));
    }

    // Markdown Tree
    if (selected && selected.label === AvailableFormats.markdown.label) {
      const basePathBeforeSelection = path.dirname(startDir.fsPath);
      const treeRef = new Tree({
        ...defaultConfig.markdown,
        basePath: basePathBeforeSelection
      });
      tree = treeRef.getTree(startDir.fsPath, 0, Number(maxDepth));
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

export interface TreeItemMask {
  default: string;
  first?: string;
  last?: string;
}
export interface TreeConfig {
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

export class Tree {
  constructor(
    private config: TreeConfig,
    public offsetRoot = 0,
    public offsetOthers = 0
  ) {
    console.log(config);
  }

  public getTree(
    targetPath: string,
    deps: number,
    maxDepth: number
  ) {
    return (this.config.beforeTree || '')
      + this.convertElementToTargetFormat(
        deps + this.offsetRoot,
        path.basename(targetPath),
        targetPath,
        true,
        true,
        false,
        true
      )
      + '<br/>'
      + this.generateTree(targetPath, deps, maxDepth)
      + (this.config.afterTree || '');
  }

  private generateTree(targetPath: string, deps: number, maxDepth?: number) {
    let textOutput = '';

    console.log('Check exists', fs.existsSync(targetPath), targetPath);

    // return if path to target is not valid
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
      const lastItem = paths.indexOf(el) === paths.length - 1;
      const firstItem = paths.indexOf(el) === 0;

      // add directories
      const textEl = this.convertElementToTargetFormat(
        deps + this.offsetOthers,
        el.toString(),
        fullPath,
        fs.statSync(fullPath).isDirectory(),
        firstItem,
        lastItem
      );
      textOutput+= this.formatLevel(deps, textEl);
      if (fs.statSync(fullPath).isDirectory()) {
        if (!maxDepth) {
          textOutput+= this.generateTree(fullPath, deps + 1);
        } else if(deps !== maxDepth - 1) {
          textOutput+= this.generateTree(fullPath, deps + 1, maxDepth);
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
