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
exports.LBKgenerate = LBKgenerate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const scan = __importStar(require("../scan"));
const autoload_1 = require("../autoload");
const jsoncExporter_1 = require("../jsoncExporter");
/**
 * Scan project subdirectories for .php files and process them for ctreating the localization files
 */
async function LBKgenerate() {
    // Search for PHP files and process them in parallel
    const scanResult = await scan.searchPhpFiles(autoload_1.config.rootPath, autoload_1.config.excludePaths, autoload_1.config.excludeGitIgnorePaths);
    // Generate JSON content
    const jsonContent = {};
    scanResult.localizationStrings.forEach(str => {
        jsonContent[str] = '';
    });
    // Get language codes from user
    const languageCodes = await vscode.window.showInputBox({
        prompt: 'Enter the 2-letter language codes separated by commas (e.g., en,fr,es)',
        value: autoload_1.config.defaultLanguages,
        placeHolder: 'en,fr,es'
    });
    if (!languageCodes) {
        vscode.window.showErrorMessage('At least one language code is required');
        return;
    }
    const languages = languageCodes.split(',').map(code => code.trim());
    if (autoload_1.config.jsoncReferenceLanguage !== '') {
        if (!languages.includes(autoload_1.config.jsoncReferenceLanguage)) {
            vscode.window.showErrorMessage(`The reference language ${autoload_1.config.jsoncReferenceLanguage} is not present in the language codes`);
            return;
        }
    }
    // Write to lang/{language}.json files
    if (autoload_1.config.langFolderPath === '') {
        vscode.window.showErrorMessage('No localization files generated: localization path not found or could not be determined.');
        return;
    }
    if (!fs.existsSync(autoload_1.config.langFolderPath)) {
        fs.mkdirSync(autoload_1.config.langFolderPath);
    }
    for (const lang of languages) {
        const outputFilePath = path.join(autoload_1.config.langFolderPath, `${lang}.json`);
        // Check if file exists and merge with existing content
        let existingContent = {};
        if (fs.existsSync(outputFilePath)) {
            const existingFile = fs.readFileSync(outputFilePath, 'utf8');
            existingContent = JSON.parse(existingFile);
        }
        const mergedContent = { ...jsonContent, ...existingContent };
        const sortedContent = sortObjectByKey(mergedContent);
        // Write to file
        fs.writeFileSync(outputFilePath, JSON.stringify(sortedContent, null, 2));
    }
    // Convertiamo il Set in oggetto labels
    const labels = {};
    scanResult.localizationStrings.forEach(label => {
        labels[label] = label; // O la traduzione se già disponibile
    });
    // Generazione dei .jsonc se configurato
    if (autoload_1.config.jsoncReferenceLanguage !== '') {
        (0, jsoncExporter_1.exportJsonc)(labels, scanResult.filesMap, {
            outputPath: path.join(autoload_1.config.langFolderPath, `${autoload_1.config.jsoncReferenceLanguage}.jsonc`),
            indentSize: 2
        });
    }
    vscode.window.showInformationMessage(`Founded ${scanResult.localizationStrings.size} localization labels in ${scanResult.filesScanned} files.`);
}
/**
 * Sorts the keys of an object alphabetically.
 * @param obj The object to sort.
 * @returns A new object with the same properties as the input object, but with its keys sorted alphabetically.
 */
function sortObjectByKey(obj) {
    return Object.keys(obj)
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
        .reduce((acc, key) => {
        acc[key] = obj[key];
        return acc;
    }, {});
}
//# sourceMappingURL=LBKgenerate.js.map