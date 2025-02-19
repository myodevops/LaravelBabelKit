## laravel-easy-localizer README

Laravel Easy Localizer is a Visual Studio Code extension that simplifies the process of extracting and managing localization strings in Laravel projects.

### Features

- Automatically scans PHP files in your Laravel project for localization strings
- Extracts strings in the format `{{ __("string") }}`
- Supports multiple languages simultaneously
- Scan only modified source files since the last scan
- Merges new strings with existing language files
- Creates a master language file (default: 'en.json') with all extracted strings

### Installation

- Open Visual Studio Code
- Go to the Extensions view (Ctrl+Shift+X)
- Search for "Laravel Easy Localizer"
- Click Install

### Usage

The extension provides a series of commands that perform localization file management operations. All commands begin with the `LEL:` prefix. 

For launching the commands:

- Open your Laravel project in VSCode
- Press Ctrl+Shift+P (Cmd+Shift+P on macOS) to open the Command Palette
- Type `LEL:` and select the desidered command

#### List of all commands of the extension

##### `LEL: Generate`  
Scan your project and generate/update language files in the lang/ directory, after prompting the list of the languages the list of languages ​​you want to generate localization for (e.g., "en,fr,es").  

##### `LEL: Clear cache`  
The extension uses a cache to ignore PHP source files that have already been scanned and remain unchanged, ensuring faster localization updates. This command clears the cache, allowing you to rescan all files.  

### Configuration

The configuration of the foo extension is done through the `.laravel-easy-localizer.json` file, which can be created in the main path of the project or in the `.vscode` directory.  
The file configuration is a JSON object that contain property for the configuration of the extension and the scope of the configuration is the project.  
Here is the list of the property of the configuration file:

| Property | Description | Values allowed |
|-|---|---|
| `defaultLanguages` | The list of languages for the files to be generated, that is suggested in the prompt that appears after launching the multilingual file generation. | A serie of language codes, usually in standard ISO 639-1 format, separated by comma. |
| `excludePaths`     | Array of directory paths that should be excluded from the scanning process. Any PHP files inside these directories will be ignored during localization extraction.|

#### Example of a configuration file
Here is an example for a typically `.laravel-easy-localizer.json` configuration file:
```json
{
    "defaultLanguages": "en,de,it",
    "excludePaths": [
        "public",
        "tests",
        "resources/views/auth"
    ]
}
```

### Release Notes
You can find a detailed list of extension implementations in the [CHANGELOG](CHANGELOG.md) file.

### Contributions 
Contributions are welcome!

### License
This extension is released under the [MIT License](LICENSE).

### Support
If you encounter any problems or have suggestions, please open a issue in the [Issue section](https://github.com/The-Young-Maker/Laravel-Easy-Localizer/issues) of the project.

**Enjoy!**
