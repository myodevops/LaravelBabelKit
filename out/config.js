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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRootPath = getRootPath;
exports.loadConfig = loadConfig;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
        excludePaths: []
    };
}
/**
 * Normalize the properties of the configuration file
 * @param config The config readed from the .laravel-easy-localizer.json file
 */
function normalizeConfig(config, rootPath) {
    config.defaultLanguages = config.defaultLanguages ?? "en";
    config.excludePaths = (config.excludePaths ?? []).map((p) => path.resolve(rootPath, p));
}
//# sourceMappingURL=config.js.map