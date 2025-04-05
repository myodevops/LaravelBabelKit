import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { config } from './autoload';

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
export async function syncLabels(): Promise<void> {
    // Get language codes from user
    const languageCodes = await vscode.window.showInputBox({
        prompt: 'Enter the 2-letter language codes separated by commas (e.g., en,fr,es)',
        value: config.defaultLanguages,
        placeHolder: 'en,fr,es'
    });

    if (!languageCodes) {
        vscode.window.showErrorMessage('At least one language code is required');
        return;
    }

    const languages = languageCodes.split(',').map(code => code.trim());
    const allLabelsSet = new Set<string>();
    const fileContents: Record<string, Record<string, string>> = {};

    if (languages.length < 2) {
        vscode.window.showErrorMessage('At least two languages are required to perform synchronization.');
        return;
    }     

    // 1. Read all files and collect all labels
    for (const lang of languages) {
        const filePath = path.join(config.langFolderPath, `${lang}.json`);

        let content: Record<string, string> = {};
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
    const allLabels = Array.from(allLabelsSet).sort((a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
    );

    // 3. For every file: sync the labels
    for (const lang of languages) {
        const content = fileContents[lang];
        const aligned: Record<string, string> = {};

        for (const label of allLabels) {
            aligned[label] = content[label] ?? "";
        }

        const filePath = path.join(config.langFolderPath, `${lang}.json`);
        fs.writeFileSync(filePath, JSON.stringify(aligned, null, 2), 'utf8');
    }

    vscode.window.showInformationMessage(`Localizations aligned.`);
}