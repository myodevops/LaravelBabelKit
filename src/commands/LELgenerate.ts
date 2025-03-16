import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as config from '../config';
import * as scan from '../scan';

/**
 * Scan project subdirectories for .php files and process them for ctreating the localization files
 * @returns 
 */
export async function LELgenerate () {
	vscode.window.showInformationMessage('Started extracting localization strings!');

	const localizationStrings: Set<string> = new Set();

	// Load the config file
	const configJson = <any>config.loadConfig();
	
	// Search for PHP files and process them in parallel
	await scan.searchPhpFiles(config.getRootPath(), 
	                          localizationStrings, 
							  configJson.excludePaths,
							  configJson.excludeGitIgnorePaths);

	// Generate JSON content
	const jsonContent: { [key: string]: string } = {};
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