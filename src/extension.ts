import { commands, ExtensionContext, Uri, ViewColumn, window, workspace } from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { TreeConfig } from './interfaces';
import { Tree } from './tree';

export function activate(ctx: ExtensionContext) {
  const disposable = commands.registerCommand('extension.fileTreeToText', async (startDir) => {
    // get configuration from `settings.json`
    const defaultConfig = workspace.getConfiguration().get('tree-generator.targets') as TreeConfig[];
    const pickerItems = defaultConfig.map((el) => el.picker);
    let maxDepth = workspace.getConfiguration().get('tree-generator.defaultDepth') as number;
    const maxFilesPerSubtree = workspace.getConfiguration().get('tree-generator.maxFilesInSubtree') as number;
    const maxDirsPerSubtree = workspace.getConfiguration().get('tree-generator.maxDirsInSubtree') as number;
    let defaultTarget = workspace.getConfiguration().get('tree-generator.defaultTarget') as string;
    let selected = pickerItems.find((el) => el.label === defaultTarget);
    const promptUser = workspace.getConfiguration().get('tree-generator.prompt') as boolean;
    const dirsOnly = workspace.getConfiguration().get('tree-generator.dirsOnly') as boolean;
    const excludeFilesGlobal = workspace.getConfiguration().get('files.exclude') as { [key: string]: boolean };
    const excludeFilesExtension = workspace.getConfiguration().get('tree-generator.exclude') as {
      [key: string]: boolean;
    };

    const excludeFiles = { ...excludeFilesGlobal, ...excludeFilesExtension };

    const globsUnfiltered = Object.keys(excludeFiles);
    const exclude = globsUnfiltered.filter((key) => excludeFiles[key]);

    // handle user prompt interaction
    if (promptUser) {
      selected = await window.showQuickPick(pickerItems);
      const depth = await window.showInputBox({
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
        const treeRef = new Tree(
          {
            ...match,
            basePath: basePathBeforeSelection,
            dirsOnly,
          },
          exclude,
        );
        tree = treeRef.getTree(
          startDir.fsPath,
          Number(maxDepth),
          Number(maxFilesPerSubtree),
          Number(maxDirsPerSubtree),
        );
      }
    }

    // initialize new web tab
    const vscodeWebViewOutputTab = window.createWebviewPanel(
      'text',
      `${selected ? selected.label : ''} File Tree`,
      { viewColumn: ViewColumn.Active },
      {
        enableScripts: true,
        // Wichtig: Beschränke den Webview auf den Zugriff auf Ressourcen in unserem Extension-Ordner
        localResourceRoots: [Uri.file(path.join(ctx.extensionPath, 'dist'))],
      },
    );

    const pathToHtml = Uri.file(path.join(ctx.extensionPath, 'dist', 'webview.html'));
    const webViewUri = vscodeWebViewOutputTab.webview.asWebviewUri(pathToHtml);

    const finalHtml = fs
      .readFileSync(path.join(ctx.extensionPath, 'dist', 'webview.html'), 'utf8')
      .replace('###TEXTTOREPLACE###', tree);

    vscodeWebViewOutputTab.webview.html = finalHtml.replace(/src=["']([^"']+)["']/g, (match, p1) => {
      const assetPath = Uri.file(path.join(ctx.extensionPath, 'dist', p1));
      return `src="${vscodeWebViewOutputTab.webview.asWebviewUri(assetPath)}"`;
    });

    ctx.subscriptions.push(disposable);
  });
}

/**
 * function that'll run when plugin will be deactivated
 */
export function deactivate() {}
