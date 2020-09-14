import { QuickPickItem } from 'vscode';

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
  picker: QuickPickItem;
  /** Define a text (HTML) which will be added before the tree items */
  beforeTree?: string;
  /** Define a text (HTML) which will be added after the tree items */
  afterTree?: string;
  /** Set a string for indent per level of the tree */
  indent: string;
  /**
   * Set a string for indent which is used preferred if set and if the parent
   * element is the last in it's subtree (not further siblings).
   * @example
   * ┃ ┃ ┃ ┗ image.jpg // indent, indent, mask:last
   * ┃ ┃ ┗ text/        // indent, indent, mask:last
   * ┃ ┃   ┣ file.txt   // indent, indent, indentParentDirIsLast, mask:default
   * ┃ ┃   ┣ file2.txt  // indent, indent, indentParentDirIsLast, mask:default
   * ┃ ┃   ┗ file3.txt  // indent, indent, indentParentDirIsLast, mask:last
   * ┃ ┣ css/           // indent, mask:default
   * ┃ ┃ ┗ style.css    // indent, indent, mask:last
   */
  indentParentDirIsLast?: string;
  /** Set a string of the base path wich will be cut from the full path */
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
