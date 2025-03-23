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
exports.loadGitIgnore = exports.config = void 0;
exports.initConfig = initConfig;
const configModule = __importStar(require("./config"));
let config = {
    rootPath: '',
    defaultLanguages: '',
    excludePaths: [],
    excludeGitIgnorePaths: false,
    autoDetectLocalizationPath: false,
    localizationPath: '',
    disableCache: false,
    langFolderPath: ''
};
exports.config = config;
async function initConfig() {
    const configJson = configModule.loadConfig();
    const localizationPath = await configModule.getLocalizationPath(configJson);
    exports.config = config = {
        rootPath: configModule.getRootPath(),
        defaultLanguages: configJson.defaultLanguages,
        excludePaths: configJson.excludePaths,
        excludeGitIgnorePaths: configJson.excludeGitIgnorePaths,
        autoDetectLocalizationPath: configJson.autoDetectLocalizationPath,
        localizationPath: configJson.localizationPath,
        disableCache: configJson.disableCache,
        langFolderPath: localizationPath ?? ''
    };
}
// Autoload of the json configuration file
initConfig();
exports.loadGitIgnore = configModule.loadGitIgnore;
//# sourceMappingURL=autoload.js.map