import * as vscode from 'vscode';
import * as cache from './../cache';

export async function LELclearcache() {
    try {
        if (cache.clearCache ()) {
            vscode.window.showInformationMessage("File hash cache cleared. All files will be reprocessed in the next generation.");
        }
    } catch (error: any) {
        vscode.window.showErrorMessage(`Error clearing cache: ${error.message}`);
    }
}
