/**
 * Represents the result of a file scan operation.
 * This interface contains the set of unique localization strings found and
 * a detailed map of where each string was found within the scanned files.
 */
export interface ScanResult {
    localizationStrings: Set<string>;
    filesMap: {
        [label: string]: {
          [filePath: string]: {
            count: number;
            fromCache: boolean;
          };
        };
    }
}
  