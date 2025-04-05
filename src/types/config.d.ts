/**
 * Represents the configuration settings for the Laravel BabelKit extension.
 * This interface defines the structure of the configuration object used to customize
 * the behavior of the localization process.
 */
export interface Config {
    rootPath: string;
    defaultLanguages: string;
    excludePaths: Array<string>;
    excludeGitIgnorePaths: boolean;
    autoDetectLocalizationPath: boolean;
    localizationPath: string;
    disableCache: boolean;
    langFolderPath: string,
    jsoncReferenceLanguage: string
}