# file-tree-to-text-generator

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=102)](https://github.com/ellerbrock/open-source-badge/)

This extension will allow you to generate file / directory trees for different target formats.
Currently supported are:

- Markdown
- LaTeX (DirTree)
- ASCII

[GitHub](https://github.com/d-koppenhagen/vscode-file-tree-to-text-generator)

## How to use

1. Install the extension
1. Right click on a directory inside the vscode file explorer and choose ("File Tree To Text")
1. Choose your target format from the prompt
1. The target code willl be generated and displayed in new tab now

## Features

See how easy it is:

![File-Tree-To-Text Demo GIF](./images/file-tree-to-text.gif)

## Extension Settings

In the current version, no extension settings can be configured. You will be prompt for necessary information.

<!---
Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

- `myExtension.enable`: enable/disable this extension
- `myExtension.thing`: set to `blah` to do something
-->

## Known Issues and Improvements

- It should be possible to limit the file tree depth, therefore a promt shoul be provided
- Add the ability to specify some default values in the vscode configuration file
- Add the ability to specify `preFileEntryString`, `postFileEntryString`, `preDirEntryString`, `postDirEntryString`, `preTreeString` and `postTreeString`, to let the user be able to customize the output
- refactor the methods for the available output generation, so that they are more generic (reduce amount of duplicate code)

## Release Notes

See [Changelog](./CHANGELOG.md)
