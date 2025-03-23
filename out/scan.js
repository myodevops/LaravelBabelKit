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
exports.searchPhpFiles = searchPhpFiles;
const vscode = __importStar(require("vscode"));
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const cache = __importStar(require("./cache"));
const autoload_1 = require("./autoload");
/**
 * Search and scan the PHP files of the projet
 * @param dir The project directory
 * @param localizationStrings The Set of files localized
 * @param excludePaths The array of the path to excluded defined in the config
 * @param excludeGitIgnore If true, follows the .gitignore file exclusion rules (in subdirectories too)
 */
async function searchPhpFiles(dir, localizationStrings, excludePaths = [], excludeGitIgnorePaths) {
    // Recover all PHP and Blade files                                    
    var files = await getPhpFiles(dir, excludePaths, excludeGitIgnorePaths);
    // Scan all the PHP files founded for searching the localization functions for estrapolate the tags
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification, // Show a notification with progress bar
        title: "Scanning PHP files...",
        cancellable: true
    }, async (progress, token) => {
        let processedFiles = 0;
        const totalFiles = files.length;
        let fileCache = cache.getCache();
        for (const file of files) {
            if (token.isCancellationRequested) {
                vscode.window.showWarningMessage("Scan cancelled.");
                return; // Stops scanning if user cancels
            }
            try {
                const content = fs.readFileSync(file, 'utf8');
                const hash = crypto.createHash('md5').update(content).digest('hex');
                if (fileCache[file] === hash) {
                    continue;
                }
                cache.addToCache(file, hash);
                // Find localized strings with __() e trans()
                const regex = /__\(\s*['"](.+?)['"]\s*(?:,\s*\[.*?\])?\s*\)/g;
                let match;
                while ((match = regex.exec(content)) !== null) {
                    localizationStrings.add(match[1]); // Adds the found strings
                }
            }
            catch (error) {
                console.error(`Error during the reading of ${file}:`, error);
            }
            processedFiles++;
            const progressPercentage = (processedFiles / totalFiles) * 100;
            progress.report({ increment: progressPercentage, message: `Scanned ${processedFiles} of ${totalFiles} file...` });
        }
        cache.saveCache();
        vscode.window.showInformationMessage("Scan completed successfully!");
    });
}
/**
 * Recursive function for finding the PHP files, ignoring the paths to be excluded
 * @param dir The current path to elaborate
 * @param excludePaths The array of the path to exclude defined in setup
 * @param excludeGitIgnore The setup option for considering the .gitignore file rules to ignore paths
 * @param ignoreRules The rules encountered during the scan
 * @returns The array of the files founded
 */
async function getPhpFiles(dir, excludePaths = [], excludeGitIgnorePaths, ignoreRules = []) {
    try {
        // Exclude manually defined directories
        if (excludePaths.includes(dir)) {
            return [];
        }
        const relativePath = path.relative(autoload_1.config.rootPath, dir);
        // Updates the ignore object with the new rules of the current directory
        let updatedIgnore = null;
        if (excludeGitIgnorePaths) {
            updatedIgnore = (0, autoload_1.loadGitIgnore)(dir, ignoreRules, autoload_1.config.rootPath);
            // If the directory is ignored, exit immediately without scanning it.
            if (relativePath > '') {
                if (updatedIgnore.ignores(relativePath)) {
                    return [];
                }
            }
        }
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        const files = await Promise.all(entries.map(async (entry) => {
            const res = path.resolve(dir, entry.name);
            return entry.isDirectory()
                ? getPhpFiles(res, excludePaths, excludeGitIgnorePaths, ignoreRules) // We pass the updated rules recursively
                : res;
        }));
        let filteredFiles = files.flat().filter(file => path.extname(file) === '.php');
        if (excludeGitIgnorePaths && updatedIgnore) {
            filteredFiles = filteredFiles.filter(file => {
                const relativePath = path.relative(autoload_1.config.rootPath, file)
                    .replace(/^(\.\.[\/\\])+/g, '') // Remove the "../"
                    .replace(/\\/g, "/"); // Convert "\" in "/" 
                return !updatedIgnore.ignores(relativePath);
            });
        }
        return filteredFiles;
    }
    catch (error) {
        console.error(`Error scanning the directory ${dir}:`, error);
        return [];
    }
}
//# sourceMappingURL=scan.js.map