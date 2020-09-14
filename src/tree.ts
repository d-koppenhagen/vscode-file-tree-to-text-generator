import { TreeConfig } from './interfaces';
import * as path from 'path';
import * as fs from 'fs';
import { isMatch } from 'micromatch';

/**
 * Create the class by handing over the tree configuration
 */
export class Tree {
  /**
   * limit the depth of the tree
   */
  private maxDepth: number | undefined;
  /**
   * limit the amount of directories in  a subtree
   */
  private maxDirsPerSubtree: number | undefined;
  /**
   * limit the amount of files in  a subtree
   */
  private maxFilesInSubtree: number | undefined;

  /**
   * Create the class by handing over the tree configuration
   * @param config The configuration for tree creation
   * @param exclude An array with glob strings to be excluded from the results
   */
  constructor(private config: TreeConfig, private exclude?: string[]) {}

  /**
   * Get the HTML output of the tree for a given path
   * @param selectedRootPath The path the user choose for tree generation
   * @param maxDepth The max depth of the generated tree.
   * @param maxFilesInSubtree The max listed number of files in a subtree.
   * @param maxDirsPerSubtree The max listed number of directories in a subtree.
   */
  public getTree(selectedRootPath: string, maxDepth?: number, maxFilesInSubtree?: number, maxDirsPerSubtree?: number) {
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
      true,
    );
    return beforeTree + rootElement + '<br/>' + this.generateTree(selectedRootPath, 0) + afterTree;
  }

  /**
   * Generate a tree or subtree for the given path and level
   * @param selectedRootPath The root from which the tree or subtree should be
   * generated
   * @param level The level from which the tree should be generated
   */
  private generateTree(selectedRootPath: string, level: number, parentDirIsLast = false) {
    let textOutput = '';

    // return if path to target is not valid
    if (!fs.existsSync(selectedRootPath)) {
      return '';
    }

    // order by directory > file
    const beforeSortFiles = fs.readdirSync(selectedRootPath);
    let dirsArray: string[] = [];

    let filesArray: string[] = [];
    beforeSortFiles.forEach((el) => {
      // exclude all files and dirs matching glob excludes
      if (this.exclude && isMatch(el.toString(), this.exclude)) {
        console.info(
          `File Tree To Text Generator: Excluding ${el.toString()} as it matches glob excludes configuration.`,
          this.exclude,
        );
        return;
      }

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
    if (this.maxFilesInSubtree && countFilesInSubtree > this.maxFilesInSubtree) {
      filesArray = filesArray.slice(0, this.maxFilesInSubtree);
      filesArray.push(maxReachedString);
    }

    const pathsAndFilesArray = [...dirsArray, ...filesArray];

    pathsAndFilesArray.forEach((el) => {
      const isLimitPlaceholder = el === maxReachedString;

      const elText = isLimitPlaceholder ? maxReachedString : el.toString();
      const fullPath = isLimitPlaceholder ? maxReachedString : path.join(selectedRootPath, el.toString());
      const lastItem = isLimitPlaceholder ? true : pathsAndFilesArray.indexOf(el) === pathsAndFilesArray.length - 1;
      const firstItem = isLimitPlaceholder ? false : pathsAndFilesArray.indexOf(el) === 0;
      const isDirectory = isLimitPlaceholder ? false : fs.statSync(fullPath).isDirectory();
      const isLastDirInTree = isDirectory && lastItem;

      // add directories
      const textEl = this.convertElementToTargetFormat(level + 2, elText, fullPath, isDirectory, firstItem, lastItem);
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
        ? Array(level).join(this.config.indent) + this.config.indentParentDirIsLast
        : Array(level + 1).join(this.config.indent);
    return `${fullIndentString}${name}<br/>`;
  }

  /**
   * This method will use the configured masks to bring the element into the
   * target format
   * @param level the level in the tree hierarchie
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
    isRoot = false,
  ) {
    // cur first part of the path (before selected dir)
    if (this.config.basePath) {
      path = path.replace(this.config.basePath, '');
    }

    // select the correct mask config for type file or directory
    const maskConfig = isDirectory ? this.config.masks.directory : this.config.masks.file;

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
    return mask.replace('#0', level.toString()).replace('#1', file).replace('#2', path);
  }
}
