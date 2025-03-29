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
exports.getCache = getCache;
exports.addToCache = addToCache;
exports.clearCache = clearCache;
exports.saveCache = saveCache;
exports.isFileCached = isFileCached;
exports.getCachedLabels = getCachedLabels;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const autoload_1 = require("./autoload");
let fileCache = {};
let cacheFileIsRead = false;
/**
 * Load the file cache (public method)
 */
function getCache() {
    if (autoload_1.config.disableCache) {
        return {};
    }
    readCacheFile();
    return fileCache;
}
/**
 * Add an entity to the file cache
 */
function addToCache(file, labels, hash) {
    if (autoload_1.config.disableCache) {
        return;
    }
    readCacheFile();
    fileCache[file] = {
        hash,
        labels
    };
}
/**
 * Empty the file cache
 */
function clearCache() {
    if (autoload_1.config.disableCache) {
        vscode.window.showErrorMessage("The cache is disabled!");
        return false;
    }
    vscode.window.showWarningMessage("Are you sure you want to clear the file hash cache? All files will be reprocessed.", { modal: true }, "Yes").then(selection => {
        if (selection === "Yes") {
            readCacheFile();
            fileCache = {};
            saveCache();
        }
    });
}
/**
 * Save the file cache
 */
function saveCache() {
    if (autoload_1.config.disableCache) {
        return;
    }
    // Save cache to file
    const cachePath = path.join(autoload_1.config.rootPath, '.localization-cache.json');
    fs.writeFileSync(cachePath, JSON.stringify(fileCache, null, 2), 'utf8');
}
/**
 * Read the file cache (local method)
 */
function readCacheFile() {
    // Read the file only a time
    if (cacheFileIsRead) {
        return;
    }
    // Load cache from file
    const cachePath = path.join(autoload_1.config.rootPath, '.localization-cache.json');
    if (fs.existsSync(cachePath)) {
        try {
            fileCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        }
        catch (e) {
            console.warn('⚠️ Failed to parse localization cache. Using empty cache.');
            fileCache = {};
        }
    }
    cacheFileIsRead = true;
}
/**
 * Returns true if the file exists in cache.
 */
function isFileCached(file, currentHash) {
    if (autoload_1.config.disableCache) {
        return false;
    }
    readCacheFile();
    return fileCache[file]?.hash === currentHash;
}
/**
 * Get cached labels for a file (if present).
 */
function getCachedLabels(file) {
    if (autoload_1.config.disableCache) {
        return null;
    }
    readCacheFile();
    return fileCache[file]?.labels || null;
}
process.on('exit', saveCache);
process.on('SIGINT', () => { saveCache(); process.exit(); }); // CTRL+C
process.on('SIGTERM', () => { saveCache(); process.exit(); }); // Kill process
//# sourceMappingURL=cache.js.map