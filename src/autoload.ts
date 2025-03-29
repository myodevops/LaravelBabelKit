import * as configModule from './config';
import { Config } from './types/config.d';

let config: Config = {
  rootPath: '',
  defaultLanguages: '',
  excludePaths: [],
  excludeGitIgnorePaths: false,
  autoDetectLocalizationPath: false,
  localizationPath: '',
  disableCache: false,
  langFolderPath: '',
  jsoncReferenceLanguage: ''
};

/**
 * Initializes the extension's configuration by loading settings from the configuration file,
 * determining the localization path, and populating the global `config` object.
 * This function will execute only the first time that the extension is activated
 * So that, if you change the configuration file, you must close and repoen Visual Studio Code
 */
async function initConfig(): Promise<void> {
  const configJson = <any>configModule.loadConfig();

  const localizationPath = await configModule.getLocalizationPath(configJson);

  config = {
      rootPath: configModule.getRootPath(),
      defaultLanguages: configJson.defaultLanguages,
      excludePaths: configJson.excludePaths,
      excludeGitIgnorePaths: configJson.excludeGitIgnorePaths,
      autoDetectLocalizationPath: configJson.autoDetectLocalizationPath,
      localizationPath: configJson.localizationPath,
      disableCache: configJson.disableCache,
      langFolderPath: localizationPath ?? '',
      jsoncReferenceLanguage: configJson.jsoncReferenceLanguage
  };
}

// Autoload of the json configuration file
initConfig();

// Export of the config object and useful methods from the config module
export { config, initConfig };
export const loadGitIgnore = configModule.loadGitIgnore;

