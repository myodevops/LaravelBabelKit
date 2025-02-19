import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as cache from './cache';

export async function searchPhpFiles(dir: string, localizationStrings: Set<string>, excludePaths: string[] = []) {
    const files = await getPhpFiles(dir, excludePaths); // Recover all PHP and Blade files

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification, // Show a notification with progress bar
        title: "Scanning PHP files...",
        cancellable: true
    }, async (progress, token) => {
        let processedFiles = 0;
        const totalFiles = files.length;
        let fileCache = cache.getCache ();

        for (const file of files) {
            if (token.isCancellationRequested) {
                vscode.window.showWarningMessage("Scan cancelled.");
                return; // Stops scanning if user cancels
            }

            try {
                const content = fs.readFileSync(file, 'utf8');
                const hash = crypto.createHash('md5').update(content).digest('hex');

                if (fileCache[file] === hash) { continue; }
                cache.addToCache (file, hash);

                // Find localized strings with __() e trans()
                const regex = /__\(\s*['"](.+?)['"]\s*(?:,\s*\[.*?\])?\s*\)/g;
                let match;
                while ((match = regex.exec(content)) !== null) {
                    localizationStrings.add(match[1]); // Adds the found strings
                }
            } catch (error) {
                console.error(`Error during the reading of ${file}:`, error);
            }

            processedFiles++;
            const progressPercentage = (processedFiles / totalFiles) * 100;
            progress.report({ increment: progressPercentage, message: `Scanned ${processedFiles} of ${totalFiles} file...` });
        }

        cache.saveCache();

        vscode.window.showInformationMessage("Scan completed successfully!");
    });
}

async function getPhpFiles(dir: string, excludePaths: string[] = []): Promise<string[]> {
    if (excludePaths.includes(dir)) {
        return []; // Avoid scanning the excluded directory
    }

	const entries = await fs.promises.readdir(dir, { withFileTypes: true });
	const files = await Promise.all(entries.map((entry) => {
		const res = path.resolve(dir, entry.name);
		return entry.isDirectory() ? getPhpFiles(res, excludePaths) : res;
	}));
	return files.flat().filter(file => path.extname(file) === '.php');
}