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
async function searchPhpFiles(dir, localizationStrings, excludePaths = []) {
    const files = await getPhpFiles(dir, excludePaths); // Recover all PHP and Blade files
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
async function getPhpFiles(dir, excludePaths = []) {
    if (excludePaths.includes(dir)) {
        return []; // Avoid scanning the excluded directory
    }
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map((entry) => {
        const res = path.resolve(dir, entry.name);
        return entry.isDirectory() ? getPhpFiles(res, excludePaths) : res;
    }));
    return files.flat().filter(file => path.extname(file) === '.php');
}
//# sourceMappingURL=scan.js.map