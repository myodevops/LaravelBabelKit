// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { isSet } from 'util/types';
import { ExecException, ExecFileException } from 'child_process';

let fileCache: Record<string, string> = {}; // Cache degli hash MD5

export function activate(context: vscode.ExtensionContext) {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders) {
		vscode.window.showErrorMessage('No workspace folder open');
		return;
	}

	const rootPath = workspaceFolders[0].uri.fsPath;

	/**
	 * Command: laravel-easy-localizer.generate
	 * Generate the Json language files used by Laravel for the localization
	 */
	const generateCmd = vscode.commands.registerCommand('laravel-easy-localizer.generate', () => {
		LELgenerte (rootPath);
	});
	context.subscriptions.push(generateCmd);

	/**
	 * Command: laravel-easy-localizer.clearcache
	 * Delete all the cached hash of the files, for rescanning all the PHP files
	 */
	const clearcacheCmd = vscode.commands.registerCommand('laravel-easy-localizer.clearcache', () => {
		LELclearcache (rootPath);
	});
	context.subscriptions.push(clearcacheCmd);
}

async function LELgenerte (rootPath: string) {
	vscode.window.showInformationMessage('Started extracting localization strings!');

	const localizationStrings: Set<string> = new Set();

	// Load the config file
	const configJson = loadConfig(rootPath);
	//const defaultLanguageCodes = isSet(configJson.defaultLanguages) ? configJson.defaultLanguages : "";
	const defaultLanguageCodes = configJson.defaultLanguages ?? "";


	// Load cache from file
	const cachePath = path.join(rootPath, '.localization-cache.json');
	if (fs.existsSync(cachePath)) {
		fileCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
	}

	// Search for PHP files and process them in parallel
	await searchPhpFiles(rootPath, localizationStrings);

	// Save cache to file
	fs.writeFileSync(cachePath, JSON.stringify(fileCache));

	// Generate JSON content
	const jsonContent: { [key: string]: string } = {};
	localizationStrings.forEach(str => {
		jsonContent[str] = '';
	});

	// Get language codes from user
	const languageCodes = await vscode.window.showInputBox({
		prompt: 'Enter the 2-letter language codes separated by commas (e.g., en,fr,es)',
		value: defaultLanguageCodes,
		placeHolder: 'en,fr,es'
	});

	if (!languageCodes) {
		vscode.window.showErrorMessage('At least one language code is required');
		return;
	}

	const languages = languageCodes.split(',').map(code => code.trim());

	// Write to lang/{language}.json files
	const langFolderPath = path.join(rootPath, 'lang');
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

async function LELclearcache(rootPath: string) {
    vscode.window.showWarningMessage(
        "Are you sure you want to clear the file hash cache? All files will be reprocessed.",
        { modal: true },
        "Yes"
    ).then(selection => {
        if (selection === "Yes") {
			try {
				const cacheFilePath = path.join(rootPath, '.localization-cache.json');
                fs.writeFileSync(cacheFilePath, "{}"); // Empty the file cache
                vscode.window.showInformationMessage("File hash cache cleared. All files will be reprocessed in the next generation.");
            } catch (error: any) {
                vscode.window.showErrorMessage(`Error clearing cache: ${error.message}`);
            }
        }
    });
}

async function searchPhpFiles(dir: string, localizationStrings: Set<string>) {
    const files = await getPhpFiles(dir); // Recupera tutti i file PHP e Blade

    // Mostra una progress bar
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification, // Mostra una notifica con progress bar
        title: "Scansione dei file PHP...",
        cancellable: true
    }, async (progress, token) => {
        let processedFiles = 0;
        const totalFiles = files.length;

        for (const file of files) {
            if (token.isCancellationRequested) {
                vscode.window.showWarningMessage("Scansione annullata.");
                return; // Interrompe la scansione se l'utente annulla
            }

            try {
                const content = fs.readFileSync(file, 'utf8');
                const hash = crypto.createHash('md5').update(content).digest('hex');

                if (fileCache[file] === hash) { continue; }
                fileCache[file] = hash;

                // Trova le stringhe localizzate con __() e trans()
                const regex = /__\(\s*['"](.+?)['"]\s*(?:,\s*\[.*?\])?\s*\)/g;
                let match;
                while ((match = regex.exec(content)) !== null) {
                    localizationStrings.add(match[1]); // Aggiunge le stringhe trovate
                }
            } catch (error) {
                console.error(`Errore durante la lettura di ${file}:`, error);
            }

            processedFiles++;
            const progressPercentage = (processedFiles / totalFiles) * 100;
            progress.report({ increment: progressPercentage, message: `Scansionato ${processedFiles} di ${totalFiles} file...` });
        }

        vscode.window.showInformationMessage("Scansione completata con successo! ✅");
    });
}

async function getPhpFiles(dir: string): Promise<string[]> {
	const entries = await fs.promises.readdir(dir, { withFileTypes: true });
	const files = await Promise.all(entries.map((entry) => {
		const res = path.resolve(dir, entry.name);
		return entry.isDirectory() ? getPhpFiles(res) : res;
	}));
	return files.flat().filter(file => path.extname(file) === '.php');
}

function loadConfig(rootPath: string) {
	const configPaths = [
		path.join(rootPath, '.laravel-easy-localizer.json'),
		path.join(rootPath, '.vscode/laravel-easy-localizer.json')
	];

	for (const configPath of configPaths) {
		if (fs.existsSync(configPath)) {
			try {
				const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
				return config;
			} catch (error) {
				console.error('Errore nel parsing del file di configurazione:', error);
			}
		}
	}

	// Se nessun file di configurazione è trovato, usa i parametri di default
	return {
		defaultLanguages: "en",
	};
}

// This method is called when your extension is deactivated
export function deactivate() { }