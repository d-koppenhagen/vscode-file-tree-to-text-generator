# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.4.0](https://github.com/d-koppenhagen/vscode-file-tree-to-text-generator/compare/v1.3.4...v1.4.0) (2020-09-14)


### Features

* allow excluding folders / files ([fcf2ddf](https://github.com/d-koppenhagen/vscode-file-tree-to-text-generator/commit/fcf2ddf1264ce2f343f76bd8abda3ad4c9a44058)), closes [#2](https://github.com/d-koppenhagen/vscode-file-tree-to-text-generator/issues/2)

### [1.3.4](https://github.com/d-koppenhagen/vscode-file-tree-to-text-generator/compare/v1.3.3...v1.3.4) (2020-09-14)


### Bug Fixes

* use correct main file path ([c50074f](https://github.com/d-koppenhagen/vscode-file-tree-to-text-generator/commit/c50074f00ea259aaea477d0c4e15d456263d0e88))

### [1.3.3](https://github.com/d-koppenhagen/vscode-file-tree-to-text-generator/compare/v1.3.2...v1.3.3) (2020-09-14)

### [1.3.2](https://github.com/d-koppenhagen/vscode-file-tree-to-text-generator/compare/v1.3.1...v1.3.2) (2020-09-14)


### Bug Fixes

* activate extension for every event ([20816f5](https://github.com/d-koppenhagen/vscode-file-tree-to-text-generator/commit/20816f53dc1c85474069f93e97a05ce49f0ebea4))

### [1.3.1](https://github.com/d-koppenhagen/vscode-file-tree-to-text-generator/compare/v1.3.0...v1.3.1) (2020-09-14)


### Bug Fixes

* use correct path to HTML template for webview ([741b5e1](https://github.com/d-koppenhagen/vscode-file-tree-to-text-generator/commit/741b5e18de3bbf6e7e4159fdc69bfd4b2f45621d))

## 1.3.0 (2020-08-25)


### Features

* wip: introduces `indentParentDirIsLast` (related to: [#1](https://github.com/d-koppenhagen/vscode-file-tree-to-text-generator/issues/1)) ([50ffbb2](https://github.com/d-koppenhagen/vscode-file-tree-to-text-generator/commit/50ffbb2b6b84f85d82bb17f1bec435bc64250e99))


### Bug Fixes

* :pencil2: traget to target ([130d401](https://github.com/d-koppenhagen/vscode-file-tree-to-text-generator/commit/130d401972c1a7fc28218de04c067eaf4cb864fa))

## [1.2.1] - 2019-09-18

### Changes

- adjusts the docs

## [1.2.0] - 2019-09-17

### New

- adds `tree-generator.maxFilesInSubtree` and `tree-generator.maxDirsInSubtree` configuration to limit the files / directories in each subtree

## [1.1.0] - 2019-09-12

### New

- adds `tree-generator.dirsOnly` configuration switch to be able to define that just directories should be used for the generated output (ignore files)

### Changes

- updates the docs

## [1.0.1] - 2019-09-12

## bug fixes

- configuration for last directories in a tree was not respected (e.g. `"directory": { "default": "┣ #1/" , "last": "┗ #1/" }` produced `┣ <DIRECTORY>/` for all directories including the last one with the default ASCII configuration

## [1.0.0] - 2019-09-10

### New

- Adds the possibility to configure custom tree generators by adding them to the configuration array in `tree-generator.targets`
- Adds the possibility to modify defualt generator settings / output by adjusting the configuration array in `tree-generator.targets`

_Example:_

```js
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

### Changes

- Renamed generator button from `File Tree To Text` to `Generate Filetree...`
- Refactored logic for tree generation
- Updates Docs

## [0.3.0] - 2019-09-06

### New

- Configure default setting via preferences
- Adds possibility to disable promt and use default configuration values instead

## [0.2.0] - 2019-09-06

### New

- let the user choose the max depth for the tree. Leaving the input in the
  prompt empty will lead to the same output as before (mo limit for depth)

## [0.1.0] - 2019-09-03 (Initial Version)

### New

- Generate file / directory trees into _ASCII_, _LATEX_ and _Markdown_ formats.

### Fixed

- nothing yet
