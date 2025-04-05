import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as scan from './../scan';
import { config } from './../autoload';
import { ScanResult } from './../types/scanresult.d';
import { exportJsonc } from './../jsoncExporter';

/**
 * Scan project subdirectories for .php files and process them for ctreating the localization files
 */
export async function LELgenerate () {
	vscode.window.showInformationMessage('Started extracting localization strings!');

	// Search for PHP files and process them in parallel
	const scanResult: ScanResult = await scan.searchPhpFiles(config.rootPath, 
							   							     config.excludePaths,
							                                 config.excludeGitIgnorePaths);

	// Generate JSON content
	const jsonContent: { [key: string]: string } = {};
	scanResult.localizationStrings.forEach(str => {
		jsonContent[str] = '';
	});

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
	if (config.jsoncReferenceLanguage !== '') {
		if (!languages.includes(config.jsoncReferenceLanguage)) {
			vscode.window.showErrorMessage(`The reference language ${config.jsoncReferenceLanguage} is not present in the language codes`);
			return;
		}
	}

	// Write to lang/{language}.json files
	if (config.langFolderPath === '') {
		vscode.window.showErrorMessage('No localization files generated: localization path not found or could not be determined.');
		return;
	}
	if (!fs.existsSync(config.langFolderPath)) {
		fs.mkdirSync(config.langFolderPath);
	}

	for (const lang of languages) {
		const outputFilePath = path.join(config.langFolderPath, `${lang}.json`);

		// Check if file exists and merge with existing content
		let existingContent = {};
		if (fs.existsSync(outputFilePath)) {
			const existingFile = fs.readFileSync(outputFilePath, 'utf8');
			existingContent = JSON.parse(existingFile);
		}

		const mergedContent = { ...jsonContent, ...existingContent };
		const sortedContent = sortObjectByKey(mergedContent);

		// Write to file
		fs.writeFileSync(outputFilePath, JSON.stringify(sortedContent, null, 2));

		vscode.window.showInformationMessage(`Localization strings extracted to ${outputFilePath}`);
	}

	// Convertiamo il Set in oggetto labels
	const labels: { [key: string]: string } = {};
	scanResult.localizationStrings.forEach(label => {
		labels[label] = label; // O la traduzione se già disponibile
	});

	// Generazione dei .jsonc se configurato
	if (config.jsoncReferenceLanguage !== '') {
		exportJsonc(labels, scanResult.filesMap, {
			outputPath: path.join(config.langFolderPath, `${config.jsoncReferenceLanguage}.jsonc`),
			indentSize: 2
		});
	}

	vscode.window.showInformationMessage(`Founded ${scanResult.localizationStrings.size} localization labels in ${scanResult.filesMap.size} files.`);
}

/**
 * Sorts the keys of an object alphabetically.
 * @param obj The object to sort.
 * @returns A new object with the same properties as the input object, but with its keys sorted alphabetically.
 */
function sortObjectByKey<T>(obj: Record<string, T>): Record<string, T> {
	return Object.keys(obj)
		.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
		.reduce((acc, key) => {
			acc[key] = obj[key];
			return acc;
		}, {} as Record<string, T>);
}
  