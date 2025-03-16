"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRootPath = getRootPath;
exports.loadConfig = loadConfig;
exports.loadGitIgnore = loadGitIgnore;
exports.getLangPath = getLangPath;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ignore_1 = __importDefault(require("ignore"));
function getRootPath() {
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
function loadConfig() {
    const configPaths = [
        path.join(getRootPath(), '.laravel-easy-localizer.json'),
        path.join(getRootPath(), '.vscode/laravel-easy-localizer.json')
    ];
    for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                normalizeConfig(config, getRootPath());
                return config;
            }
            catch (error) {
                console.error('Error parsing configuration file:', error);
            }
        }
    }
    // If no configuration file is found, use the default parameters
    return {
        defaultLanguages: "en",
        excludePaths: [],
        excludeGitIgnorePaths: false
    };
}
/**
 * Load and process the .gitignore in the param dir path, if exists
 * @param dir The directory who read the .gitignore file
 * @param ignoreRules The ignore rules sofar found
 * @returns The new ignore rules updated with the new findings
 */
function loadGitIgnore(dir, ignoreRules, projectRoot) {
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
                //let relativePath = path.relative(projectRoot, path.join(dir, cleanRule));
                let normalizedRule = cleanRule.replace(/\\/g, "/");
                let relativePath = normalizedRule.includes("*")
                    ? normalizedRule
                    : path.relative(projectRoot, path.join(dir, normalizedRule)).replace(/\\/g, "/");
                return isNegation ? `!${relativePath}` : relativePath;
            });
            ignoreRules.push(...newRules);
        }
        catch (error) {
            console.error(`Error reading .gitignore in ${dir}:`, error);
        }
    }
    // Create a new ignore instance with all updated rules
    return (0, ignore_1.default)().add(ignoreRules);
}
/**
 * Normalize the properties of the configuration file
 * @param config The config readed from the .laravel-easy-localizer.json file
 */
function normalizeConfig(config, rootPath) {
    config.defaultLanguages = config.defaultLanguages ?? "en";
    config.excludePaths = (config.excludePaths ?? []).map((p) => path.resolve(rootPath, p));
    config.excludeGitIgnorePaths = (config.excludeGitIgnorePaths ?? true); // Default true if not present
}
/**
 * Determines the language directory path based on Laravel's version and common structure.
 * It checks if a `lang` directory exists in `resources` and returns its path.
 * If not, it checks if a `lang` directory exists directly in the root and returns that instead.
 * If none of the above and version under 7.0, it return rootLangPath, if not return resources path.
 * @returns The path to the language directory, or the default if not found.
 */
function getLangPath() {
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
function getLaravelVersion() {
    const composerPath = path.join(getRootPath(), 'composer.json');
    if (fs.existsSync(composerPath)) {
        try {
            const composerContent = JSON.parse(fs.readFileSync(composerPath, 'utf-8'));
            if (composerContent.require && composerContent.require['laravel/framework']) {
                return composerContent.require['laravel/framework'];
            }
        }
        catch (error) {
            console.error('Error parsing composer.json:', error);
        }
    }
    return null;
}
//# sourceMappingURL=config.js.map