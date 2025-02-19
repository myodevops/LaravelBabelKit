import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function getRootPath () {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    let rootPath = '';
    if (workspaceFolders) { 
        rootPath = workspaceFolders[0].uri.fsPath;
    }

    return rootPath;
}

/**
 * Load the .laravel-easy-localizer.json configuration file and normalize the config object
 * @param rootPath The root path of the Laravel project
 * @returns 
 */
export function loadConfig() {
    const configPaths = [
        path.join(getRootPath(), '.laravel-easy-localizer.json'),
        path.join(getRootPath(), '.vscode/laravel-easy-localizer.json')
    ];

    for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                normalizeConfig (config, getRootPath());
                return config;
            } catch (error) {
                console.error('Error parsing configuration file:', error);
            }
        }
    }

    // If no configuration file is found, use the default parameters
    return {
        defaultLanguages: "en",
        excludePaths: []
    };
}

/**
 * Normalize the properties of the configuration file
 * @param config The config readed from the .laravel-easy-localizer.json file
 */
function normalizeConfig (config: any, rootPath: string) {
    config.defaultLanguages = config.defaultLanguages ?? "en";

    config.excludePaths = (config.excludePaths ?? []).map((p: string) => path.resolve(rootPath, p));
}