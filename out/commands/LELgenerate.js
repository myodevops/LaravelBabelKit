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
exports.LELgenerate = LELgenerate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config = __importStar(require("../config"));
const scan = __importStar(require("../scan"));
async function LELgenerate() {
    vscode.window.showInformationMessage('Started extracting localization strings!');
    const localizationStrings = new Set();
    // Load the config file
    const configJson = config.loadConfig();
    // Search for PHP files and process them in parallel
    await scan.searchPhpFiles(config.getRootPath(), localizationStrings, configJson.excludePaths);
    // Generate JSON content
    const jsonContent = {};
    localizationStrings.forEach(str => {
        jsonContent[str] = '';
    });
    // Get language codes from user
    const languageCodes = await vscode.window.showInputBox({
        prompt: 'Enter the 2-letter language codes separated by commas (e.g., en,fr,es)',
        value: configJson.defaultLanguages,
        placeHolder: 'en,fr,es'
    });
    if (!languageCodes) {
        vscode.window.showErrorMessage('At least one language code is required');
        return;
    }
    const languages = languageCodes.split(',').map(code => code.trim());
    // Write to lang/{language}.json files
    const langFolderPath = path.join(config.getRootPath(), 'lang');
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
//# sourceMappingURL=LELgenerate.js.map