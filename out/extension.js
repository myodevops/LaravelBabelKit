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
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
let fileCache = {}; // Cache degli hash MD5
function activate(context) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    /**
     * Command: laravel-easy-localizer.generate
     * Generate the Json language files used by Laravel for the localization
     */
    const generateCmd = vscode.commands.registerCommand('laravel-easy-localizer.generate', () => {
        LELgenerte(rootPath);
    });
    context.subscriptions.push(generateCmd);
    /**
     * Command: laravel-easy-localizer.clearcache
     * Delete all the cached hash of the files, for rescanning all the PHP files
     */
    const clearcacheCmd = vscode.commands.registerCommand('laravel-easy-localizer.clearcache', () => {
        LELclearcache(rootPath);
    });
    context.subscriptions.push(clearcacheCmd);
}
async function LELgenerte(rootPath) {
    vscode.window.showInformationMessage('Started extracting localization strings!');
    const localizationStrings = new Set();
    // Load the config file
    const configJson = loadConfig(rootPath);
    //const defaultLanguageCodes = isSet(configJson.defaultLanguages) ? configJson.defaultLanguages : "";
    const defaultLanguageCodes = configJson.defaultLanguages ?? "";
    // Load cache from file
    const cachePath = path.join(rootPath, '.localization-cache.json');
    if (fs.existsSync(cachePath)) {
        fileCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    }
    // Search for PHP files and process them in parallel
    await searchPhpFiles(rootPath, localizationStrings);
    // Save cache to file
    fs.writeFileSync(cachePath, JSON.stringify(fileCache));
    // Generate JSON content
    const jsonContent = {};
    localizationStrings.forEach(str => {
        jsonContent[str] = '';
    });
    // Get language codes from user
    const languageCodes = await vscode.window.showInputBox({
        prompt: 'Enter the 2-letter language codes separated by commas (e.g., en,fr,es)',
        value: defaultLanguageCodes,
        placeHolder: 'en,fr,es'
    });
    if (!languageCodes) {
        vscode.window.showErrorMessage('At least one language code is required');
        return;
    }
    const languages = languageCodes.split(',').map(code => code.trim());
    // Write to lang/{language}.json files
    const langFolderPath = path.join(rootPath, 'lang');
    if (!fs.existsSync(langFolderPath)) {
        fs.mkdirSync(langFolderPath);
    }
    for (const lang of languages) {
        const outputFilePath = path.join(langFolderPath, `${lang}.json`);
        // Check if file exists and merge with existing content
        let existingContent = {};
        if (fs.existsSync(outputFilePath)) {
            const existingFile = fs.readFileSync(outputFilePath, 'utf8');
            existingContent = JSON.parse(existingFile);
        }
        const mergedContent = { ...jsonContent, ...existingContent };
        fs.writeFileSync(outputFilePath, JSON.stringify(mergedContent, null, 2));
        vscode.window.showInformationMessage(`Localization strings extracted to ${outputFilePath}`);
    }
}
async function LELclearcache(rootPath) {
    vscode.window.showWarningMessage("Are you sure you want to clear the file hash cache? All files will be reprocessed.", { modal: true }, "Yes").then(selection => {
        if (selection === "Yes") {
            try {
                const cacheFilePath = path.join(rootPath, '.localization-cache.json');
                fs.writeFileSync(cacheFilePath, "{}"); // Empty the file cache
                vscode.window.showInformationMessage("File hash cache cleared. All files will be reprocessed in the next generation.");
            }
            catch (error) {
                vscode.window.showErrorMessage(`Error clearing cache: ${error.message}`);
            }
        }
    });
}
async function searchPhpFiles(dir, localizationStrings) {
    const files = await getPhpFiles(dir); // Recupera tutti i file PHP e Blade
    // Mostra una progress bar
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification, // Mostra una notifica con progress bar
        title: "Scansione dei file PHP...",
        cancellable: true
    }, async (progress, token) => {
        let processedFiles = 0;
        const totalFiles = files.length;
        for (const file of files) {
            if (token.isCancellationRequested) {
                vscode.window.showWarningMessage("Scansione annullata.");
                return; // Interrompe la scansione se l'utente annulla
            }
            try {
                const content = fs.readFileSync(file, 'utf8');
                const hash = crypto.createHash('md5').update(content).digest('hex');
                if (fileCache[file] === hash) {
                    continue;
                }
                fileCache[file] = hash;
                // Trova le stringhe localizzate con __() e trans()
                const regex = /__\(\s*['"](.+?)['"]\s*(?:,\s*\[.*?\])?\s*\)/g;
                let match;
                while ((match = regex.exec(content)) !== null) {
                    localizationStrings.add(match[1]); // Aggiunge le stringhe trovate
                }
            }
            catch (error) {
                console.error(`Errore durante la lettura di ${file}:`, error);
            }
            processedFiles++;
            const progressPercentage = (processedFiles / totalFiles) * 100;
            progress.report({ increment: progressPercentage, message: `Scansionato ${processedFiles} di ${totalFiles} file...` });
        }
        vscode.window.showInformationMessage("Scansione completata con successo! ✅");
    });
}
async function getPhpFiles(dir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map((entry) => {
        const res = path.resolve(dir, entry.name);
        return entry.isDirectory() ? getPhpFiles(res) : res;
    }));
    return files.flat().filter(file => path.extname(file) === '.php');
}
function loadConfig(rootPath) {
    const configPaths = [
        path.join(rootPath, '.laravel-easy-localizer.json'),
        path.join(rootPath, '.vscode/laravel-easy-localizer.json')
    ];
    for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                return config;
            }
            catch (error) {
                console.error('Errore nel parsing del file di configurazione:', error);
            }
        }
    }
    // Se nessun file di configurazione è trovato, usa i parametri di default
    return {
        defaultLanguages: "en",
    };
}
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map