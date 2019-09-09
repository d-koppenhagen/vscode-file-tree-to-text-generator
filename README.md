# file-tree-to-text-generator

[![VSCode Marketplace](https://vsmarketplacebadge.apphb.com/version/d-koppenhagen.file-tree-to-text-generator.svg)](https://marketplace.visualstudio.com/items?itemName=d-koppenhagen.file-tree-to-text-generator)
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
1. Choose the max depth or leave the output empty to get the whole tree from the choosen directory
1. The target code willl be generated and displayed in new tab now

## Features

See how easy it is:

![File-Tree-To-Text Demo GIF](./images/file-tree-to-text.gif)

## Extension Settings

You can easily set default values and even disable the promt.

![File-Tree-To-Text Configuration](./images/file-tree-to-text-config.png)

### Define custom generators or modify defaults

You can define custom generators or modify the default outputs by adjusting the configuration in you `settings.json` file.
The place for that is the `tree-generator.targets` array.

The `masks` property defines the main style for different kinds of entries (directories, files).
All props in `masks` will can use placeholders which will be replaces by the generator with the following contents:

- `#0` : Insert the tree level number (e.g. "2")
- `#1` : Insert the name of the file or directory (e.g. "myFile.txt" or "myDirectory")
- `#2` : Insert the relative path to the file or directory starting from the selected directory (e.g. "/src/someFile.txt" or "/src/someDirectory")

As an example the mask `#0: [#1](.#2)` will lead into `1: [file1.txt](./path/to/file/file1.txt)`.

```json
"tree-generator.targets": [
  {
      "picker": {
          "label": "ASCII",
          "description": "Convert to ASCII Tree"
      },
      "beforeTree": "",
      "afterTree": "",
      "indent": "┃ ",
      "masks": {
          "root": "#1/",
          "file": {
              "default": "┣ #1",
              "last": "┗ #1"
          },
          "directory": {
              "default": "┣ #1/"
          }
      }
  }
  // ...
]
```

## Known Issues and Improvements

- Add a `dirsOnly` flag, to skip files
- Add a `maxFilesPerSubtree` flag and a string configuration for e.g. `...` as last subTree item

## Release Notes

See [Changelog](./CHANGELOG.md)
