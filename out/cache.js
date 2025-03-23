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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const autoload_1 = require("./autoload");
let fileCache = {}; // Cache of hash MD5
let cacheFileIsRead = false;
function getCache() {
    if (autoload_1.config.disableCache) {
        return {};
    }
    readCacheFile();
    return fileCache;
}
function addToCache(file, hash) {
    if (autoload_1.config.disableCache) {
        return;
    }
    readCacheFile();
    fileCache[file] = hash;
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
function saveCache() {
    if (autoload_1.config.disableCache) {
        return;
    }
    // Save cache to file
    const cachePath = path.join(autoload_1.config.rootPath, '.localization-cache.json');
    fs.writeFileSync(cachePath, JSON.stringify(fileCache));
}
function readCacheFile() {
    // Read the file only a time
    if (cacheFileIsRead) {
        return;
    }
    // Load cache from file
    const cachePath = path.join(autoload_1.config.rootPath, '.localization-cache.json');
    if (fs.existsSync(cachePath)) {
        fileCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    }
    cacheFileIsRead = true;
}
process.on('exit', saveCache);
process.on('SIGINT', () => { saveCache(); process.exit(); }); // CTRL+C
process.on('SIGTERM', () => { saveCache(); process.exit(); }); // Kill process
//# sourceMappingURL=cache.js.map