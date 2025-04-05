import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { config } from './autoload';
import { FileCacheEntry } from './types/labelcache';

let fileCache: Record<string, FileCacheEntry> = {};
let cacheFileIsRead = false;

/**
 * Load the file cache (public method)
 */
export function getCache () {
    if (config.disableCache) { return {}; }

    readCacheFile ();
    return fileCache;
}

/**
 * Add an entity to the file cache
 */
export function addToCache (file: string, labels: Record<string, number>, hash: string): void {
    if (config.disableCache) { return; }

    readCacheFile ();

    fileCache[file] = {
        hash,
        labels
    };
}

/**
 * Empty the file cache
 */
export function clearCache () { 
    if (config.disableCache) { 
        vscode.window.showErrorMessage("The cache is disabled!");
        return false;
    }

    vscode.window.showWarningMessage(
        "Are you sure you want to clear the file hash cache? All files will be reprocessed.",
        { modal: true },
        "Yes"
    ).then(selection => {
        if (selection === "Yes") {
            readCacheFile ();
            fileCache = {};
            saveCache (); 
        }
    });
}

/**
 * Save the file cache
 */
export function saveCache () {
    if (config.disableCache) { return; }
    
    // Save cache to file
    const cachePath = path.join(config.rootPath, '.localization-cache.json');
    fs.writeFileSync(cachePath, JSON.stringify(fileCache, null, 2), 'utf8'); 
}

/**
 * Read the file cache (local method)
 */
function readCacheFile () {
    // Read the file only a time
    if (cacheFileIsRead) { return; }
    
    // Load cache from file
    const cachePath = path.join(config.rootPath, '.localization-cache.json');
    if (fs.existsSync(cachePath)) {
        try {
            fileCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        } catch (e) {
            console.warn('⚠️ Failed to parse localization cache. Using empty cache.');
            fileCache = {};
        }
    }
    
    cacheFileIsRead = true;
}

/**
 * Returns true if the file exists in cache.
 */
export function isFileCached(file: string, currentHash: string): boolean {
    if (config.disableCache) {
        return false;
    }
    
    readCacheFile();
    return fileCache[file]?.hash === currentHash;
}

/**
 * Get cached labels for a file (if present).
 */
export function getCachedLabels(file: string): Record<string, number> | null {
    if (config.disableCache) {
        return null;
    }

    readCacheFile();
    return fileCache[file]?.labels || null;
}

process.on('exit', saveCache);
process.on('SIGINT', () => { saveCache(); process.exit(); }); // CTRL+C
process.on('SIGTERM', () => { saveCache(); process.exit(); }); // Kill process