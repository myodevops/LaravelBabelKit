/**
 * Options for configuring the export of data to JSONC (JSON with Comments) files.
 */
export interface ExportJsoncOptions {
    indentSize?: number;
    trailingComma?: boolean;
    outputPath: string;
}