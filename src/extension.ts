import * as vscode from 'vscode';
import { LELgenerate } from './commands/LELgenerate';
import { LELclearcache } from './commands/LELclearcache';
import { LELsynclabels } from './commands/LELsynclabels';

/**
 * Activates the Laravel Easy Localizer extension.
 * This function is called by VS Code when the extension is loaded and activated.
 * It registers the commands provided by the extension and sets up the necessary resources.
 * @param context The extension context provided by VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
	/**
	 * Command: laravel-easy-localizer.generate
	 * Generate the Json language files used by Laravel for the localization
	 */
	const generateCmd = vscode.commands.registerCommand('laravel-easy-localizer.generate', () => {
		LELgenerate ();
	});
	context.subscriptions.push(generateCmd);

	/**
	 * Command: laravel-easy-localizer.clearcache
	 * Delete all the cached hash of the files, for rescanning all the PHP files
	 */
	const clearcacheCmd = vscode.commands.registerCommand('laravel-easy-localizer.clearcache', () => {
		LELclearcache ();
	});
	context.subscriptions.push(clearcacheCmd);

	/**
	 * Command: laravel-easy-localizer.sync-labels
	 * Synchronizes the localization files between languages
	 */
	const synclabelsCmd = vscode.commands.registerCommand('laravel-easy-localizer.sync-labels', () => {
		LELsynclabels ();
	});
	context.subscriptions.push(clearcacheCmd);
}

// This method is called when your extension is deactivated
export function deactivate() { }