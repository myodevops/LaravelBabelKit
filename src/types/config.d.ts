export interface Config {
    rootPath: string;
    defaultLanguages: string;
    excludePaths: Array<string>;
    excludeGitIgnorePaths: boolean;
    autoDetectLocalizationPath: boolean;
    localizationPath: string;
    disableCache: boolean;
    langFolderPath: string
}