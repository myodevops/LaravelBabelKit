import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';

/**
 * Return the root path of the project
 */
export function getRootPath () {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    let rootPath = '';
    if (workspaceFolders) { 
        rootPath = workspaceFolders[0].uri.fsPath;
    }

    return rootPath;
}

/**
 * Load the .laravel-babelkit.json configuration file and normalize the config object
 * @param rootPath The root path of the Laravel project
 */
export function loadConfig() {
    const configPaths = [
        path.join(getRootPath(), '.laravel-babelkit.json'),
        path.join(getRootPath(), '.vscode/laravel-babelkit.json')
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
        excludePaths: [],
        excludeGitIgnorePaths: true,
        autoDetectLocalizationPath: false,
        localizationPath: "",
        disableCache: false,
        jsoncReferenceLanguage: ""
    };
}

/**
 * Load and process the .gitignore in the param dir path, if exists
 * @param dir The directory who read the .gitignore file
 * @param ignoreRules The ignore rules sofar found
 * @returns The new ignore rules updated with the new findings
 */
export function loadGitIgnore(dir: string, ignoreRules: string[], projectRoot: string): ReturnType<typeof ignore> {
    const gitignorePath = path.join(dir, '.gitignore');

    if (fs.existsSync(gitignorePath)) {
        try {
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
            const newRules = gitignoreContent.split(/\r?\n/)
                                             .map(line => line.trim())
                                             .filter(line => line && !line.startsWith('#')) // Remove void and comment lines
                                             .map(rule => {
                                                let isNegation = rule.startsWith("!");
                                                let cleanRule = rule.replace(/^!/, "");                            
                                                let normalizedRule = cleanRule.replace(/\\/g, "/");

                                                let relativePath: string = "";
                                                switch (true) {
                                                    case normalizedRule === "*":
                                                        relativePath = path.relative(projectRoot, path.join(dir, "**")).replace(/\\/g, "/");
                                                        break;
                                                    case (normalizedRule.startsWith ("*")) && (dir === projectRoot):
                                                        relativePath = normalizedRule;
                                                        break;
                                                    default:
                                                        relativePath = path.relative(projectRoot, path.join(dir, normalizedRule)).replace(/\\/g, "/");
                                                        break;
                                                }

                                                return isNegation ? `!${relativePath}` : relativePath;
                                            });
            ignoreRules.push(...newRules);
        } catch (error) {
            console.error(`Error reading .gitignore in ${dir}:`, error);
        }
    }

    // Create a new ignore instance with all updated rules
    return ignore().add(ignoreRules);
}

/**
 * Normalize the properties of the configuration file
 * @param config The config readed from the .laravel-babelkit.json file
 */
function normalizeConfig (config: any, rootPath: string) {
    if (typeof config.defaultLanguages === 'string') {
        config.defaultLanguages = config.defaultLanguages ?? "en";
    } else {
        config.defaultLanguages = "en";
    }
    
    config.excludePaths = (config.excludePaths ?? []).map((p: string) => path.resolve(rootPath, p));

    config.excludeGitIgnorePaths = (config.excludeGitIgnorePaths ?? true);

    config.autoDetectLocalizationPath = (config.autoDetectLocalizationPath ?? false);

    config.localizationPath = (config.localizationPath ?? "");
    
    config.disableCache = (config.disableCache ?? false);

    if (typeof config.defaultLanguages === 'string') {
        config.jsoncReferenceLanguage = config.jsoncReferenceLanguage ?? "";
    } else {
        config.jsoncReferenceLanguage = "";
    }
}

/**
 * Determines the language directory path based on Laravel's version and common structure.
 * It checks if a `lang` directory exists in `resources` and returns its path.
 * If not, it checks if a `lang` directory exists directly in the root and returns that instead.
 * If none of the above and version under 7.0, it return rootLangPath, if not return resources path.
 * @returns The path to the language directory, or the default if not found.
 */
export function getLangPath(): string {
    const rootPath = getRootPath();
    const resourcesLangPath = path.join(rootPath, 'resources', 'lang');
    const rootLangPath = path.join(rootPath, 'lang');

    const laravelVersion = getLaravelVersion();

    if (fs.existsSync(resourcesLangPath) && fs.statSync(resourcesLangPath).isDirectory()) {
        return resourcesLangPath;
    }

    if (fs.existsSync(rootLangPath) && fs.statSync(rootLangPath).isDirectory()) {
        return rootLangPath;
    }

    // Determine the default path based on Laravel version if the path not exists
    if (laravelVersion) {
        // Check if the version is less than 7.0 
        const versionMatch = laravelVersion.match(/(\d+)/);
        if (versionMatch && parseInt(versionMatch[1]) < 7) {
            return rootLangPath; // Old version, default to root/lang
        }
    }

    // Default path for versions 7.0 and above, or if version cannot be determined
    return resourcesLangPath;
}

/**
 * Get the Laravel framework version from the composer.json file
 * @returns The Laravel framework version as string (e.g. "10.*", "9.*", null if not found)
 */
function getLaravelVersion(): string | null {
    const composerPath = path.join(getRootPath(), 'composer.json');
    if (fs.existsSync(composerPath)) {
        try {
            const composerContent = JSON.parse(fs.readFileSync(composerPath, 'utf-8'));
            if (composerContent.require && composerContent.require['laravel/framework']) {
                return composerContent.require['laravel/framework'];
            }
        } catch (error) {
            console.error('Error parsing composer.json:', error);
        }
    }
    return null;
}

/**
 * Return the path of the localization based on the configuration file or on the Laravel version
 * @returns 
 */
export async function getLocalizationPath(configJson: any): Promise<string | null> {
    const workspaceRoot = getRootPath();

    // 1. Check manual config
    if (configJson.localizationPath) {
        if (configJson.localizationPath.startsWith("/")) {
            configJson.localizationPath = configJson.localizationPath.substring(1);
        }
        
        const absoluteManualPath = path.isAbsolute(configJson.localizationPath)
            ? configJson.localizationPath
            : path.join(workspaceRoot, configJson.localizationPath);

        if (fs.existsSync(absoluteManualPath)) {
            return absoluteManualPath;
        } else {
            vscode.window.showWarningMessage(`The configured localizationPath "${configJson.localizationPath}" does not exist.`);
            return null;
        }
    }

    // 2. Auto detect

    if (configJson.autoDetectLocalizationPath) {
        const localizationPath = await autoDetectLocalizationPath(workspaceRoot);
        return localizationPath ? localizationPath : null;
    }

    // 3. No path found
    vscode.window.showErrorMessage('Localization path not found. Please set "localizationPath" in settings or enable autoDetectLocalizationPath.');
    return null;
}

/**
 * Detect the localization path or propose it based on the Laravel version
 * @param workspaceRoot 
 * @returns 
 */
async function autoDetectLocalizationPath(workspaceRoot: string): Promise<string | null> {
    const langPath = path.join(workspaceRoot, 'lang');
    const resourcesLangPath = path.join(workspaceRoot, 'resources', 'lang');

    // Step 1: Check ./lang
    if (fs.existsSync(langPath)) {
        return langPath;
    }

    // Step 2: Check ./resources/lang
    if (fs.existsSync(resourcesLangPath)) {
        return resourcesLangPath;
    }

    // Step 3: Read Laravel version
    const composerJsonPath = path.join(workspaceRoot, 'composer.json');
    if (fs.existsSync(composerJsonPath)) {
        const composerContent = JSON.parse(fs.readFileSync(composerJsonPath, 'utf8'));
        const requireSection = composerContent.require || composerContent['require-dev'];

        if (requireSection && requireSection['laravel/framework']) {
            const versionString = requireSection['laravel/framework'] as string;
            const match = versionString.match(/\d+/);

            let laravelVersion: number | null = null;
            if (match && match[0]) {
                laravelVersion = parseInt(match[0], 10);
            }

            const suggestedPath = (() => {
                switch (true) {
                    case (laravelVersion !== null && !isNaN(laravelVersion) && laravelVersion >= 9):
                        return langPath;
                    default:
                        return resourcesLangPath;
                }
            })();

            const selection = await vscode.window.showWarningMessage(
                `Localization path not found. Create folder in ${suggestedPath}?`,
                { modal: true },
                "Yes"
            );

            if (selection === "Yes") {
                fs.mkdirSync(suggestedPath, { recursive: true });
                return suggestedPath;
            } else {
                return null;
            }            
        }
    }

    // Default case: No path found
    return null;
}