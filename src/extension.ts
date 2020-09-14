import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TreeConfig } from './interfaces';
import { Tree } from './tree';

export function activate(ctx: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('extension.fileTreeToText', async (startDir) => {
    // get configuration from `settings.json`
    const defaultConfig = vscode.workspace.getConfiguration().get('tree-generator.targets') as TreeConfig[];
    const pickerItems = defaultConfig.map((el) => el.picker);
    let maxDepth = vscode.workspace.getConfiguration().get('tree-generator.defaultDepth') as number;
    const maxFilesPerSubtree = vscode.workspace.getConfiguration().get('tree-generator.maxFilesInSubtree') as number;
    const maxDirsPerSubtree = vscode.workspace.getConfiguration().get('tree-generator.maxDirsInSubtree') as number;
    let defaultTarget = vscode.workspace.getConfiguration().get('tree-generator.defaultTarget') as string;
    let selected = pickerItems.find((el) => el.label === defaultTarget);
    const promptUser = vscode.workspace.getConfiguration().get('tree-generator.prompt') as boolean;
    const dirsOnly = vscode.workspace.getConfiguration().get('tree-generator.dirsOnly') as boolean;

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
      const match = defaultConfig.find((el) => el.picker.label === searchLabel);
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
          Number(maxDirsPerSubtree),
        );
      }
    }

    // initialize new web tab
    const vscodeWebViewOutputTab = vscode.window.createWebviewPanel(
      'text',
      `${selected ? selected.label : ''} File Tree`,
      { viewColumn: vscode.ViewColumn.Active },
      { enableScripts: true },
    );

    const uri = vscode.Uri.parse(ctx.asAbsolutePath(path.join('dist', 'webview.html')));
    const pathUri = uri.with({ scheme: 'vscode-resource' });
    const finalHtml = fs.readFileSync(pathUri.fsPath, 'utf8').replace('###TEXTTOREPLACE###', tree);
    vscodeWebViewOutputTab.webview.html = finalHtml;

    ctx.subscriptions.push(disposable);
  });
}

/**
 * function that'll run when plugin will be deactivated
 */
export function deactivate() {}
