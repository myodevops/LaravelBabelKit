import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { config } from './autoload';


let fileCache: Record<string, string> = {}; // Cache of hash MD5
let cacheFileIsRead = false;

export function getCache () {
    if (config.disableCache) { return {}; }

    readCacheFile ();
    return fileCache;
}

export function addToCache (file: string, hash: string) { 
    if (config.disableCache) { return; }

    readCacheFile ();
    fileCache[file] = hash;
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

export function saveCache () {
    if (config.disableCache) { return; }
    
    // Save cache to file
    const cachePath = path.join(config.rootPath, '.localization-cache.json');
    fs.writeFileSync(cachePath, JSON.stringify(fileCache));   
}

function readCacheFile () {
    // Read the file only a time
    if (cacheFileIsRead) { return; }
    
    // Load cache from file
    const cachePath = path.join(config.rootPath, '.localization-cache.json');
    if (fs.existsSync(cachePath)) {
        fileCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    }
    
    cacheFileIsRead = true;
}

process.on('exit', saveCache);
process.on('SIGINT', () => { saveCache(); process.exit(); }); // CTRL+C
process.on('SIGTERM', () => { saveCache(); process.exit(); }); // Kill process