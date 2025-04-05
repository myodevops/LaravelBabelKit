import * as vscode from 'vscode';
import { LBKgenerate } from './commands/LBKgenerate';
import { LBKclearcache } from './commands/LBKclearcache';
import { LBKsynclabels } from './commands/LBKsynclabels';

/**
 * Activates the Laravel BabelKit extension.
 * This function is called by VS Code when the extension is loaded and activated.
 * It registers the commands provided by the extension and sets up the necessary resources.
 * @param context The extension context provided by VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
	/**
	 * Command: laravel-babelkit.generate
	 * Generate the Json language files used by Laravel for the localization
	 */
	const generateCmd = vscode.commands.registerCommand('laravel-babelkit.generate', () => {
		LBKgenerate ();
	});
	context.subscriptions.push(generateCmd);

	/**
	 * Command: laravel-babelkit.clearcache
	 * Delete all the cached hash of the files, for rescanning all the PHP files
	 */
	const clearcacheCmd = vscode.commands.registerCommand('laravel-babelkit.clearcache', () => {
		LBKclearcache ();
	});
	context.subscriptions.push(clearcacheCmd);

	/**
	 * Command: laravel-babelkit.sync-labels
	 * Synchronizes the localization files between languages
	 */
	const synclabelsCmd = vscode.commands.registerCommand('laravel-babelkit.sync-labels', () => {
		LBKsynclabels ();
	});
	context.subscriptions.push(clearcacheCmd);
}

// This method is called when your extension is deactivated
export function deactivate() { }