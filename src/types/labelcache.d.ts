/**
 * Represents a single entry in the file cache.
 * Stores the file's content hash and the count of each label found within the file.
 */
export interface FileCacheEntry {
  hash: string;
  labels: {
    [label: string]: number;
  };
}

/**
 * Represents the overall label cache, mapping file paths to their corresponding FileCacheEntry.
 * This cache is used to track changes in files and avoid reprocessing unchanged files.
 */
export interface LabelCache {
  [filePath: string]: FileCacheEntry;
}