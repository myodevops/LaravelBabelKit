import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import * as crypto from 'crypto';

const WORKER_COUNT = 4; // Adjust based on your system's CPU cores

interface FileCache {
  [filePath: string]: string; // MD5 hash of file content
}

let fileCache: FileCache = {};

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('extension.extractLocalizationStrings', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    vscode.window.showInformationMessage('Started extracting localization strings!');

    const rootPath = workspaceFolders[0].uri.fsPath;
    const localizationStrings: Set<string> = new Set();

    // Load cache from file
    const cachePath = path.join(rootPath, '.localization-cache.json');
    if (fs.existsSync(cachePath)) {
      fileCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    }

    // Search for PHP files and process them in parallel
    await searchPhpFiles(rootPath, localizationStrings);

    // Save cache to file
    fs.writeFileSync(cachePath, JSON.stringify(fileCache));

    // Generate JSON content
    const jsonContent: { [key: string]: string } = {};
    localizationStrings.forEach(str => {
      jsonContent[str] = '';
    });

    // Get language codes from user
    const languageCodes = await vscode.window.showInputBox({
      prompt: 'Enter the 2-letter language codes separated by commas (e.g., en,fr,es)',
      placeHolder: 'en,fr,es'
    });

    if (!languageCodes) {
      vscode.window.showErrorMessage('At least one language code is required');
      return;
    }

    const languages = languageCodes.split(',').map(code => code.trim());

    // Write to lang/{language}.json files
    const langFolderPath = path.join(rootPath, 'lang');
    if (!fs.existsSync(langFolderPath)) {
      fs.mkdirSync(langFolderPath);
    }

    for (const lang of languages) {
      const outputFilePath = path.join(langFolderPath, `${lang}.json`);

      // Check if file exists and merge with existing content
      let existingContent = {};
      if (fs.existsSync(outputFilePath)) {
        const existingFile = fs.readFileSync(outputFilePath, 'utf8');
        existingContent = JSON.parse(existingFile);
      }

      const mergedContent = { ...jsonContent, ...existingContent };
      fs.writeFileSync(outputFilePath, JSON.stringify(mergedContent, null, 2));

      vscode.window.showInformationMessage(`Localization strings extracted to ${outputFilePath}`);
    }
  });

  context.subscriptions.push(disposable);
}

async function searchPhpFiles(dir: string, localizationStrings: Set<string>) {
  if (isMainThread) {
    const files = await getPhpFiles(dir);
    const chunks = chunkArray(files, Math.ceil(files.length / WORKER_COUNT));

    const workers = chunks.map(chunk =>
      new Promise((resolve, reject) => {
        const worker = new Worker(__filename, {
          workerData: { files: chunk, cache: fileCache }
        });
        worker.on('message', (message) => {
          message.forEach((str: string) => localizationStrings.add(str));
          resolve(null);
        });
        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          }
        });
      })
    );

    await Promise.all(workers);
  } else {
    const { files, cache } = workerData;
    const localStrings: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const hash = crypto.createHash('md5').update(content).digest('hex');

      if (cache[file] !== hash) {
        const regex = /{{\s*__\(\s*["'](.+?)["']\s*(?:,\s*\[.*?\])?\s*\)\s*}}/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          localStrings.push(match[1]);
        }
        cache[file] = hash;
      }
    }
    parentPort?.postMessage(localStrings);
  }
}

async function getPhpFiles(dir: string): Promise<string[]> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const res = path.resolve(dir, entry.name);
    return entry.isDirectory() ? getPhpFiles(res) : res;
  }));
  return files.flat().filter(file => path.extname(file) === '.php');
}

function chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
}

export function deactivate() { }