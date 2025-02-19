import * as vscode from 'vscode';
import * as cache from '../cache';

export async function LELclearcache() {
    vscode.window.showWarningMessage(
        "Are you sure you want to clear the file hash cache? All files will be reprocessed.",
        { modal: true },
        "Yes"
    ).then(selection => {
        if (selection === "Yes") {
			try {
				cache.clearCache ();
                vscode.window.showInformationMessage("File hash cache cleared. All files will be reprocessed in the next generation.");
            } catch (error: any) {
                vscode.window.showErrorMessage(`Error clearing cache: ${error.message}`);
            }
        }
    });
}