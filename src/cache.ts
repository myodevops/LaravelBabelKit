import * as fs from 'fs';
import * as path from 'path';
import * as config from './config';

let fileCache: Record<string, string> = {}; // Cache of hash MD5
let cacheFileIsRead = false;

export function getCache () {
    readCacheFile ();
    return fileCache;
}

export function addToCache (file: string, hash: string) { 
    readCacheFile ();
    fileCache[file] = hash;
}

/**
 * Empty the file cache
 */
export function clearCache () { 
    fileCache = {};
    saveCache (); 
}

export function saveCache () {
    // Save cache to file
    const cachePath = path.join(config.getRootPath(), '.localization-cache.json');
    fs.writeFileSync(cachePath, JSON.stringify(fileCache));   
}

function readCacheFile () {
    // Read the file only a time
    if (cacheFileIsRead) { return; }
    
    // Load cache from file
    const cachePath = path.join(config.getRootPath(), '.localization-cache.json');
    if (fs.existsSync(cachePath)) {
        fileCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    }
    
    cacheFileIsRead = true;
}

process.on('exit', saveCache);
process.on('SIGINT', () => { saveCache(); process.exit(); }); // CTRL+C
process.on('SIGTERM', () => { saveCache(); process.exit(); }); // Kill process