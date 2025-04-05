import * as vscode from 'vscode';
import * as synclabels from '../synclabels';

/**
 * Synchronizes the localization files between languages.
 */
export async function LBKsynclabels() {
    try {
        await synclabels.syncLabels();
    } catch (error: any) {
        vscode.window.showErrorMessage(`Error in labels syncronization: ${error.message}`);
    }
}