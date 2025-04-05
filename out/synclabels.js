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
exports.syncLabels = syncLabels;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const autoload_1 = require("./autoload");
/**
 * Synchronizes the localization files between languages.
 *
 * - Prompts the user to select the language codes to synchronize.
 * - Reads all existing localization files in the `langFolderPath` directory.
 * - Builds a unified set of all labels used across the selected files.
 * - Sorts labels alphabetically in a case-insensitive manner.
 * - For each file, ensures all labels are present:
 *   - Existing labels keep their value.
 *   - Missing labels are added with an empty value `""`.
 * - Overwrites each JSON file with the aligned and sorted content.
 *
 * This ensures consistency across all selected localization files,
 * making translation and multilingual text maintenance easier.
 */
async function syncLabels() {
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
    const allLabelsSet = new Set();
    const fileContents = {};
    if (languages.length < 2) {
        vscode.window.showErrorMessage('At least two languages are required to perform synchronization.');
        return;
    }
    // 1. Read all files and collect all labels
    for (const lang of languages) {
        const filePath = path.join(autoload_1.config.langFolderPath, `${lang}.json`);
        let content = {};
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf8');
            content = JSON.parse(raw);
        }
        fileContents[lang] = content;
        Object.keys(content).forEach(label => {
            allLabelsSet.add(label);
        });
    }
    // 2. Case-sensitive sort of all labels
    const allLabels = Array.from(allLabelsSet).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    // 3. For every file: sync the labels
    for (const lang of languages) {
        const content = fileContents[lang];
        const aligned = {};
        for (const label of allLabels) {
            aligned[label] = content[label] ?? "";
        }
        const filePath = path.join(autoload_1.config.langFolderPath, `${lang}.json`);
        fs.writeFileSync(filePath, JSON.stringify(aligned, null, 2), 'utf8');
    }
    vscode.window.showInformationMessage(`Localizations aligned.`);
}
//# sourceMappingURL=synclabels.js.map