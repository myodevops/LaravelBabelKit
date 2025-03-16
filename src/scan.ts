import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as cache from './cache';
import * as config from './config';

/**
 * Search and scan the PHP files of the projet
 * @param dir The project directory
 * @param localizationStrings The Set of files localized
 * @param excludePaths The array of the path to excluded defined in the config
 * @param excludeGitIgnore If true, follows the .gitignore file exclusion rules (in subdirectories too)
 */
export async function searchPhpFiles(dir: string, 
                                     localizationStrings: Set<string>, 
                                     excludePaths: string[] = [], 
                                     excludeGitIgnorePaths: boolean) {
    // Recover all PHP and Blade files                                    
    var files = await getPhpFiles(dir, excludePaths, excludeGitIgnorePaths); 

    // Scan all the PHP files founded for searching the localization functions for estrapolate the tags
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

/**
 * Recursive function for finding the PHP files, ignoring the paths to be excluded
 * @param dir The current path to elaborate
 * @param excludePaths The array of the path to exclude defined in setup
 * @param excludeGitIgnore The setup option for considering the .gitignore file rules to ignore paths
 * @param ignoreRules The rules encountered during the scan
 * @returns The array of the files founded
 */
async function getPhpFiles(
    dir: string,
    excludePaths: string[] = [],
    excludeGitIgnorePaths: boolean,
    ignoreRules: string[] = []
): Promise<string[]> {
    try {      
        // Exclude manually defined directories
        if (excludePaths.includes(dir)) {
            return [];
        }

        const relativePath = path.relative(config.getRootPath(), dir);
        
        // Updates the ignore object with the new rules of the current directory
        let updatedIgnore = null;
        if (excludeGitIgnorePaths) {
            updatedIgnore = config.loadGitIgnore(dir, ignoreRules, config.getRootPath());

            // If the directory is ignored, exit immediately without scanning it.
            if (relativePath > '') {
                if (updatedIgnore.ignores(relativePath)) {
                    return [];
                }
            }
        }

        const entries = await fs.promises.readdir(dir, { withFileTypes: true });

        const files = await Promise.all(entries.map(async (entry) => {
            const res = path.resolve(dir, entry.name);

            return entry.isDirectory()
                ? getPhpFiles(res, excludePaths, excludeGitIgnorePaths, ignoreRules) // We pass the updated rules recursively
                : res;
        }));

        let filteredFiles = files.flat().filter(file => path.extname(file) === '.php');
        if (excludeGitIgnorePaths && updatedIgnore) {
            filteredFiles = filteredFiles.filter(file => {
                const relativePath = path.relative(config.getRootPath(), file)
                    .replace(/^(\.\.[\/\\])+/g, '')  // Remove the "../"
                    .replace(/\\/g, "/");  // Convert "\" in "/" 
                return !updatedIgnore.ignores(relativePath);
            });                
        }

        return filteredFiles;
    } catch (error) {
        console.error(`Error scanning the directory ${dir}:`, error);
        return [];
    }
}