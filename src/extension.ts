import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';

let terminal: vscode.Terminal;

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "xp-runner" is now active!');

	let buildRunner = vscode.commands.registerCommand('xp-runner.buildRunner', (data: vscode.Uri) => {
			let stats = fs.lstatSync(data.path);
			let result = data.path;
			if (stats.isFile()) {
				let currentFilePath = path.dirname(data.path);
				let extname = path.extname(data.path);
				result = path.join(currentFilePath, `*${extname}`);
			} else if (stats.isDirectory()) {
				result = path.join(data.path, `**.dart`);
			}
			
			if (!terminal) {
				terminal = vscode.window.createTerminal('build_runner');
				terminal.show();
			}
			let shellPath = path.join(__dirname, 'shell.sh');
			let nodejs = path.join(__dirname, 'node.js');

			vscode.window.showInformationMessage('build_runner is running...');

			// terminal.sendText(`flutter pub run build_runner build --build-filter '${result}'`);
			terminal.sendText(`chmod u+x ${shellPath}; ${shellPath} "${result}"`);
			// terminal.sendText(`node ${nodejs} '${result}'`);

			vscode.window.onDidCloseTerminal(() => {
				terminal.dispose();
			});
			
	});

	context.subscriptions.push(...[buildRunner]);
}

// This method is called when your extension is deactivated
export function deactivate() {}
