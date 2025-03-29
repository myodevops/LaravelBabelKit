"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportJsonc = exportJsonc;
const fs = __importStar(require("fs"));
/**
 * Exports a JSONC file with comments containing the source files of the labels
 *
 * @param labels Object with labels as keys and translated values as values
 * @param filesMap Object that maps each label to the array of source files where it was found
 * @param options  Options for formatting the file
 */
function exportJsonc(labels, filesMap, options) {
    const indentSize = options.indentSize ?? 2;
    const trailingComma = options.trailingComma ?? false;
    const outputPath = options.outputPath;
    const outputLines = ['{'];
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
//# sourceMappingURL=jsoncExporter.js.map