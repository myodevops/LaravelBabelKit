## Laravel BabelKit README

Laravel BabelKit is a Visual Studio Code extension that simplifies the process of extracting and managing localization strings in Laravel projects.

### Features

- Automatically scans PHP files in your Laravel project for localization strings
- Extracts labels in the following formats:
```
   __('label')
   __("label")
   trans('label')
   trans("label")
   @lang('label')
   @lang("label")
```

- Supports multiple languages simultaneously
- Scan only modified source files since the last scan
- Merges new strings with existing language files
- Creates a master language file (default: 'en.jsonc') with all extracted strings and the corrispettive files as comments

### Installation

- Open Visual Studio Code
- Go to the Extensions view (Ctrl+Shift+X)
- Search for "Laravel BabelKit"
- Click Install

### Usage

The extension provides a series of commands that perform localization file management operations. All commands begin with the `LBK:` prefix. 

For launching the commands:

- Open your Laravel project in VSCode
- Press Ctrl+Shift+P (Cmd+Shift+P on macOS) to open the Command Palette
- Type `LBK:` and select the desidered command

#### List of all commands of the extension

##### `LBK: Generate`  
Scan your project and generate/update language files in the lang directory of the project, after prompting the list of the languages the list of languages ​​you want to generate localization for (e.g., "en,fr,es"). The labels in the generated localization .json files are sorted alphabetically.

##### `LBK: Clear cache`  
The extension uses a cache to ignore PHP source files that have already been scanned and remain unchanged, ensuring faster localization updates. This command clears the cache, allowing you to rescan all files.

##### `LBK: Sync labels`
Synchronizes all localization files by ensuring they contain the exact same set of keys, aligned in the same alphabetical order. Missing keys in any language file are automatically added with empty values. This makes translation management easier and keeps all localization files structurally consistent. This command is especially useful when adding a new language to your project, as it generates a complete translation file with all the necessary keys ready to be filled.

### Configuration

The configuration of the foo extension is done through the `.laravel-babelkit.json` file, which can be created in the main path of the project or in the `.vscode` directory.  
The file configuration is a JSON object that contain property for the configuration of the extension and the scope of the configuration is the project.  
Here is the list of the property of the configuration file:

| Property | Description | Values allowed |
|-|---|---|
| `defaultLanguages`      | The list of languages for the files to be generated, that is suggested in the prompt that appears after launching the multilingual file generation. | A serie of language codes, usually in standard ISO 639-1 format, separated by comma. |
| `excludePaths`          | Array of directory paths that should be excluded from the scanning process. Any PHP files inside these directories will be ignored during localization extraction. |Specify only the directory names as seen from the project root (e.g., "vendor" instead of "./vendor" or "/var/www/myproject/vendor"). |
| `excludeGitIgnorePaths` | When enabled, this option ensures that any files and directories matching the rules defined in the project's `.gitignore` files are automatically excluded from the localization scan process. It simplifies configuration by preventing unnecessary scanning of files such as vendor dependencies, build artifacts, or other ignored paths. | `true` (default value if the property is not specified) or `false`<br>**Note**: This option strictly follows Git's standard `.gitignore` behavior. Rules are applied relative to the directory where each `.gitignore` file is located. Improper or unconventional rule usage—such as referencing redundant or incorrect paths—will not be interpreted or corrected by the extension. Refer to the official Gitignore documentation for proper rule syntax and usage. |
| `localizationPath` | Defines the relative or absolute path to the directory where localization JSON files are stored. If set, this path will take priority over automatic detection. Use this option if your project has a custom localization directory structure. | A valid relative or absolute path. |
| `autoDetectLocalizationPath ` | Enables automatic detection of the localization directory if no manual path is set. It checks common Laravel paths like /lang and /resources/lang, and can propose creating the directory if not found. | True (default value if the property is not specified) or False |
| `disableCache` | Disables the caching mechanism used by the extension. By default, the extension caches the content of scanned files to avoid re-scanning unchanged files, significantly speeding up subsequent scans. Enabling this option forces the extension to re-scan all files every time, regardless of whether they have been modified. | `true` or `false` (default value if the property is not specified: `false`) |
| `jsoncReferenceLanguage` | Allows generating a `.jsonc` localization file with source file comments, only for a specific language defined by the option. | Enter a language code useful for creating the `.jsonc` file |    

#### Example of a configuration file
Here is an example for a typically `.laravel-babelkit.json` configuration file:
```json
{
    "defaultLanguages": "en,de,it",
    "excludePaths": [
        "public",
        "tests",
        "resources/views/auth"
    ],
    "jsoncReferenceLanguage": "en"
}
```

Here is an example for a `.laravel-babelkit.json` configuration file with all the options:
```json
{
    "defaultLanguages": "en,de,it",
    "excludePaths": [
        "public",
        "tests",
        "resources/views/auth"
    ],
    "excludeGitIgnorePaths": true,
    "localizationPath": "lang/",
    "autoDetectLocalizationPath": true,
    "disableCache": false,
    "jsoncReferenceLanguage": "en"
}
```

### Cache Management
This extension uses an internal cache mechanism to improve performance during repeated scans. The cache is stored in the `.localization-cache.json` file at the root of the project. It keeps track of previously scanned files and their extracted labels to avoid unnecessary reprocessing.

#### How It Works
- When **cache is enabled** (default), the extension reads from the `.localization-cache.json` file to determine which files can be skipped.
- After a scan, the cache is updated with any new or changed files.
- When **cache is disabled**, the extension ignores and does not update the cache file. All files will be scanned every time.

This behavior is controlled by the disableCache option in the configuration file.<br>
If set to `true`, the extension will:

- Ignore the existing `.localization-cache.json` file, even if present.
- Always perform a full scan of all files.
- Not write or update the cache file.

#### Cache and `.jsonc` File Generation
The cache also plays a role in the generation of the `.jsonc` file, which includes comments indicating where each label was found.<br>
When cache is enabled:

- The source file references used in the `.jsonc` output are retrieved from the cache if available, improving performance during export.
- When cache is disabled:
- The extension performs a full scan to regenerate source references, ensuring that the `.jsonc` file reflects the current state of all scanned files.

#### Important Notes
- In case of unexpected results in generating localization files, delete the cache using the appropriate command and relaunch the generation.
- The `.localization-cache.json` file is automatically managed by the extension and does not require manual editing.
- Including files `.laravel-babelkit.json` and `.localization-cache.json` in the `.gitignore` file is highly recommended.
- When `disableCache` is `true`, performance may decrease for large projects, but it guarantees complete rescan behavior.
- The handling of `.gitignore` files is implemented to cover the most common cases, but it may not fully reflect all edge cases defined by Git's ignore rules. 
- If you notice any inconsistencies or missing scenarios, feel free to open an issue — they will be reviewed and addressed as soon as possible.

### Release Notes
You can find a detailed list of extension implementations in the [CHANGELOG](CHANGELOG.md) file.

### Contributions 
Contributions are welcome!

### License
This extension is released under the [MIT License](LICENSE).

### Acknowledgment
Special thanks to [TheYoungMaker](https://marketplace.visualstudio.com/publishers/TheYoungMaker) for the inspiration and for developing the original *Laravel Easy Localizer* extension, which laid the foundation for this project.

### Support
If you encounter any problems or have suggestions, please open a issue in the [Issue section](https://github.com/myodevops/LaravelBabelKit/issues)) of the project.

**Enjoy!**
