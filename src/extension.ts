import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';
import { formBlocTemplate, formStateTemplate } from './template/form/bloc_form';

let terminal: vscode.Terminal | null;

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "xp-runner" is now active!');

	let buildRunner = vscode.commands.registerCommand('xp-runner.buildRunner', (data: vscode.Uri) => {
			let stats = fs.lstatSync(data.path);
			let result = data.path;
			if (stats.isFile()) {
				let currentFilePath = path.dirname(data.path);
				let extname = path.extname(data.path);
				result = path.join(currentFilePath, `*`);
			} else if (stats.isDirectory()) {
				result = path.join(data.path, `**`);
			}
			
			if (!terminal) {
				terminal = vscode.window.createTerminal('build_runner');
				terminal.show();
			}
			let shellPath = path.join(__dirname, 'shell.sh');
			let nodejs = path.join(__dirname, 'node.js');
			let commands = `${shellPath} "${result}"`;
			try {
				fs.accessSync(shellPath, fs.constants.X_OK);
			}catch(e) {
				commands = `chmod u+x ${shellPath}; ${shellPath} "${result}"`;
			}

			vscode.window.showInformationMessage('build_runner is running...');
			terminal.sendText(commands);
			// terminal.sendText(`flutter pub run build_runner build --build-filter '${result}'`);
			// terminal.sendText(`node ${nodejs} '${result}'`);

			vscode.window.onDidCloseTerminal((t) => {
				terminal?.dispose();
				terminal = null;
			});
			
	});


	let formDisposable = vscode.commands.registerCommand('openai-for-code.form', generateFormCode);

	context.subscriptions.push(...[buildRunner, formDisposable]);
}

// This method is called when your extension is deactivated
export function deactivate() {}


// 根据文件名生成form模版代码
async function generateFormCode(data: vscode.Uri): Promise<any> {
	const fileNameSplitFlag = '_';
	const cubitDir = 'cubit';
	let inputResult = await vscode.window.showInputBox();

	if (!inputResult) {
		vscode.window.showErrorMessage('请输入完整的文件名');
		return;
	}

	const fsStat = fs.statSync(data.path);
	let dirname = data.path;

	if (fsStat.isFile()) {
		dirname = path.dirname(data.path);
	} else {
		let basename = path.basename(data.path);
		if (basename !== cubitDir) {
			dirname = path.join(data.path, cubitDir);
		}
	}
	let cubitFilePath = path.join(dirname, inputResult + '_cubit.dart');
	let stateFilePath = path.join(dirname, inputResult + '_state.dart');

	if (fs.existsSync(cubitFilePath) || fs.existsSync(stateFilePath)) {
		vscode.window.showErrorMessage('文件已存在');
		return;
	}
	
	let blocClassName = inputResult;
	if (inputResult.indexOf(fileNameSplitFlag) > -1) {
		let fileNameList = inputResult.split(fileNameSplitFlag);
		let resultStr = "";
		fileNameList.forEach((item,index) => {
			resultStr += item.substring(0,1).toUpperCase() + item.substring(1);
		});
		blocClassName = resultStr;
	}
	
	let cubitFileContent = formBlocTemplate(blocClassName, inputResult);
	let stateFileContent = formStateTemplate(blocClassName, inputResult);

	fs.writeFileSync(cubitFilePath, cubitFileContent);
	fs.writeFileSync(stateFilePath, stateFileContent);
}
