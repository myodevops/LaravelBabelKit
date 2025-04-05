import * as vscode from 'vscode';
import * as cache from '../cache';

/**
 * Clears the file hash cache, forcing all files to be reprocessed during the next localization generation.
 * Displays a success or error message to the user via VS Code's notification system.
 */
export async function LBKclearcache() {
    try {
        if (cache.clearCache ()) {
            vscode.window.showInformationMessage("File hash cache cleared. All files will be reprocessed in the next generation.");
        }
    } catch (error: any) {
        vscode.window.showErrorMessage(`Error clearing cache: ${error.message}`);
    }
}
