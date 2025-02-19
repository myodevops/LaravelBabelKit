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
exports.LELclearcache = LELclearcache;
const vscode = __importStar(require("vscode"));
const cache = __importStar(require("../cache"));
async function LELclearcache() {
    vscode.window.showWarningMessage("Are you sure you want to clear the file hash cache? All files will be reprocessed.", { modal: true }, "Yes").then(selection => {
        if (selection === "Yes") {
            try {
                cache.clearCache();
                vscode.window.showInformationMessage("File hash cache cleared. All files will be reprocessed in the next generation.");
            }
            catch (error) {
                vscode.window.showErrorMessage(`Error clearing cache: ${error.message}`);
            }
        }
    });
}
//# sourceMappingURL=LELclearcache.js.map