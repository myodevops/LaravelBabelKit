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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const LBKgenerate_1 = require("./commands/LBKgenerate");
const LBKclearcache_1 = require("./commands/LBKclearcache");
const LBKsynclabels_1 = require("./commands/LBKsynclabels");
/**
 * Activates the Laravel BabelKit extension.
 * This function is called by VS Code when the extension is loaded and activated.
 * It registers the commands provided by the extension and sets up the necessary resources.
 * @param context The extension context provided by VS Code.
 */
function activate(context) {
    /**
     * Command: laravel-babelkit.generate
     * Generate the Json language files used by Laravel for the localization
     */
    const generateCmd = vscode.commands.registerCommand('laravel-babelkit.generate', () => {
        (0, LBKgenerate_1.LBKgenerate)();
    });
    context.subscriptions.push(generateCmd);
    /**
     * Command: laravel-babelkit.clearcache
     * Delete all the cached hash of the files, for rescanning all the PHP files
     */
    const clearcacheCmd = vscode.commands.registerCommand('laravel-babelkit.clearcache', () => {
        (0, LBKclearcache_1.LBKclearcache)();
    });
    context.subscriptions.push(clearcacheCmd);
    /**
     * Command: laravel-babelkit.sync-labels
     * Synchronizes the localization files between languages
     */
    const synclabelsCmd = vscode.commands.registerCommand('laravel-babelkit.sync-labels', () => {
        (0, LBKsynclabels_1.LBKsynclabels)();
    });
    context.subscriptions.push(clearcacheCmd);
}
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map