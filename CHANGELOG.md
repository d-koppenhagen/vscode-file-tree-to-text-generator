# Change Log

All notable changes to the "file-tree-to-text-generator" extension will be documented in this file.

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
