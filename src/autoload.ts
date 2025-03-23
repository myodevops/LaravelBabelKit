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
  langFolderPath: ''
};

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
      langFolderPath: localizationPath ?? ''
  };
}

// Autoload of the json configuration file
initConfig();

// Export of the config object and useful methods from the config module
export { config, initConfig };
export const loadGitIgnore = configModule.loadGitIgnore;

