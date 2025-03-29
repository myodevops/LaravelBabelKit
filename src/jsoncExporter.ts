import * as fs from 'fs';
import { ExportJsoncOptions } from './types/exportjsoncoptions.d';

/**
 * Exports a JSONC file with comments containing the source files of the labels
 * 
 * @param labels Object with labels as keys and translated values as values
 * @param filesMap Object that maps each label to the array of source files where it was found
 * @param options  Options for formatting the file
 */
export function exportJsonc(
  labels: { [key: string]: string },
  filesMap: {
    [key: string]: {
      [filePath: string]: {
        count: number;
        fromCache: boolean;
      };
    };
  },
  options: ExportJsoncOptions
): void {

  const indentSize = options.indentSize ?? 2;
  const trailingComma = options.trailingComma ?? false;
  const outputPath = options.outputPath;

  const outputLines: string[] = ['{'];

  const entries = Object.entries(labels);
  entries.forEach(([key, value], index) => {
    const fileData = filesMap[key] || {};

    const paths = Object.entries(fileData).map(([filePath, meta], idx) => {
      const countText = meta.count > 1 ? ` (${meta.count})` : '';
      return `${filePath}${countText}`;
    });

    // Add a comment with the source files
    if (paths.length > 0) {
      const indent = ' '.repeat(indentSize);
      paths.forEach((line, idx) => {
        const prefix = idx === 0 ? '// Found in: ' : '//           ';
        outputLines.push(`${indent}${prefix}${line}`);
      });
    }

    // Writing of the key-value pair
    const line = `${' '.repeat(indentSize)}"${key}": "${value}"${(index < entries.length - 1 || trailingComma) ? ',' : ''}`;
    outputLines.push(line);
  });

  outputLines.push('}');

  // Writing of .jsonc file
  fs.writeFileSync(outputPath, outputLines.join('\n'), 'utf8');
}
