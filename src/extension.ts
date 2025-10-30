import * as vscode from "vscode";
import path from "path";
import fs from "fs";
import { formBlocTemplate, formStateTemplate } from "./template/form/bloc_form";
import { pulldownListCodeBuilder, widgetBuilder, filterPulldownListCodeBuilder } from "./template/list_page/widget";
import {
  cubitCodeBuilder,
  pulldownListCubitCodeBuilder,
  pulldownListStateCodeBuilder,
  stateCodeBuilder,
  filterPulldownCubitCodeBuilder,
  filterPulldownStateCodeBuilder,
} from "./template/list_page/cubit";

let terminal: vscode.Terminal | null;

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "xp-runner" is now active!');

  let buildRunner = vscode.commands.registerCommand("xp-runner.buildRunner", (data: vscode.Uri) => {
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
      terminal = vscode.window.createTerminal("build_runner");
      terminal.show();
    }
    let shellPath = path.join(__dirname, "shell.sh");
    let nodejs = path.join(__dirname, "node.js");
    let commands = `${shellPath} "${result}"`;
    try {
      fs.accessSync(shellPath, fs.constants.X_OK);
    } catch (e) {
      commands = `chmod u+x ${shellPath}; ${shellPath} "${result}"`;
    }

    vscode.window.showInformationMessage("build_runner is running...");
    terminal.sendText(commands);
    // terminal.sendText(`flutter pub run build_runner build --build-filter '${result}'`);
    // terminal.sendText(`node ${nodejs} '${result}'`);

    vscode.window.onDidCloseTerminal((t) => {
      terminal?.dispose();
      terminal = null;
    });
  });

  let formDisposable = vscode.commands.registerCommand("openai-for-code.form", generateFormCode);

  // 创建列表页代码
  let listPageDisposable = vscode.commands.registerCommand("openai-for-code.listPage", generateListPageCode);

  context.subscriptions.push(...[buildRunner, formDisposable, listPageDisposable]);
}

// This method is called when your extension is deactivated
export function deactivate() {}

// 根据文件名生成form模版代码
async function generateFormCode(data: vscode.Uri): Promise<any> {
  try {
    const fileNameSplitFlag = "_";
    const cubitDir = "cubit";
    let inputResult = await vscode.window.showInputBox();

    if (!inputResult) {
      vscode.window.showErrorMessage("请输入完整的文件名");
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
    let cubitFilePath = path.join(dirname, inputResult + "_cubit.dart");
    let stateFilePath = path.join(dirname, inputResult + "_state.dart");

    if (fs.existsSync(cubitFilePath) || fs.existsSync(stateFilePath)) {
      vscode.window.showErrorMessage("文件已存在");
      return;
    }

    let blocClassName = inputResult;
    if (inputResult.indexOf(fileNameSplitFlag) > -1) {
      let fileNameList = inputResult.split(fileNameSplitFlag);
      let resultStr = "";
      fileNameList.forEach((item, index) => {
        resultStr += item.substring(0, 1).toUpperCase() + item.substring(1);
      });
      blocClassName = resultStr;
    }

    let cubitFileContent = formBlocTemplate(blocClassName, inputResult);
    let stateFileContent = formStateTemplate(blocClassName, inputResult);

    fs.writeFileSync(cubitFilePath, cubitFileContent);
    fs.writeFileSync(stateFilePath, stateFileContent);

    vscode.window.showInformationMessage("Form 代码生成成功！");
  } catch (error) {
    console.error("生成 Form 代码时出错:", error);
    vscode.window.showErrorMessage(`生成 Form 代码失败: ${error}`);
  }
}

// 根据文件名生成列表页代码
async function generateListPageCode(data: vscode.Uri): Promise<any> {
  const fileNameSplitFlag = "_";
  const cubitDir = "cubit";
  const quickPickOptions = [
    {
      label: "普通列表",
      description: "单个pulldown列表页面",
      value: "common_pulldown",
    },
    {
      label: "tabBarView列表",
      description: "具有Tabbar的pulldown列表页面",
      value: "tabbar_pulldown",
    },
    {
      label: "筛选列表",
      description: "具有客户列表相同筛选功能的Tabbar pulldown列表页面",
      value: "filter_search_pulldown",
    },
  ];
  let inputResult = await vscode.window.showInputBox({ placeHolder: "请输入需创建的文件名（不含后缀）" });

  if (!inputResult) {
    vscode.window.showErrorMessage("请输入完整的文件名");
    return;
  }

  let selectedOption = await vscode.window.showQuickPick(quickPickOptions);
  // 页面文件名
  const pageFileName = inputResult + "_page.dart";

  // cubit文件名
  const fsStat = fs.statSync(data.path);

  if (fsStat.isDirectory()) {
    vscode.window.showErrorMessage("非选择文件");
    return;
  }

  try {
    let cubitDirUri = await checkAndCreateCubitDir(data.path);
    let cubitFileName = inputResult + "_cubit.dart";
    let stateFileName = inputResult + "_state.dart";

    let cubitFilePath, stateFilePath;
    let dirname = path.dirname(data.path);
    if (!cubitDirUri) {
      cubitFilePath = path.join(dirname, cubitFileName);
      stateFilePath = path.join(dirname, stateFileName);
    } else {
      cubitFilePath = path.join(cubitDirUri, cubitFileName);
      stateFilePath = path.join(cubitDirUri, stateFileName);
    }

    let className = inputResult;
    if (inputResult.indexOf(fileNameSplitFlag) > -1) {
      let fileNameList = inputResult.split(fileNameSplitFlag);
      let resultStr = "";
      fileNameList.forEach((item, index) => {
        resultStr += item.substring(0, 1).toUpperCase() + item.substring(1);
      });
      className = resultStr;
    }

    let relativePath = path.relative(dirname, cubitFilePath);
    let widgetContent, cubitContent, stateContent;
    if (selectedOption && selectedOption.value === "common_pulldown") {
      widgetContent = widgetBuilder(className, relativePath);
      cubitContent = cubitCodeBuilder(className, inputResult);
      stateContent = stateCodeBuilder(className, inputResult);
    } else if (selectedOption && selectedOption.value === "tabbar_pulldown") {
      widgetContent = pulldownListCodeBuilder(className, relativePath);
      cubitContent = pulldownListCubitCodeBuilder(className, inputResult);
      stateContent = pulldownListStateCodeBuilder(className, inputResult);
    } else if (selectedOption && selectedOption.value === "filter_search_pulldown") {
      widgetContent = filterPulldownListCodeBuilder(className, relativePath);
      cubitContent = filterPulldownCubitCodeBuilder(className, inputResult);
      stateContent = filterPulldownStateCodeBuilder(className, inputResult);
    }

    fs.writeFileSync(path.join(path.dirname(data.path), pageFileName), widgetContent!);
    fs.writeFileSync(cubitFilePath, cubitContent!);
    fs.writeFileSync(stateFilePath, stateContent!);

    vscode.window.showInformationMessage("列表页代码生成成功！");
  } catch (error) {
    console.error("生成列表页代码时出错:", error);
    vscode.window.showErrorMessage(`生成列表页代码失败: ${error}`);
  }
}

// 判断目录中是否存在cubit目录
async function checkAndCreateCubitDir(dataPath: string): Promise<string | null> {
  try {
    let workSpaceDir = vscode.workspace.workspaceFolders?.at(0)?.uri.fsPath;
    let currentCubitDir: string | null = null;

    if (dataPath === workSpaceDir) {
      return null;
    }

    // 先获取当前文件路径同级目录路径。
    let fsStat = fs.statSync(dataPath);
    let dirname = dataPath;

    if (fsStat.isFile()) {
      dirname = path.dirname(dataPath);
    }

    // 检查dirname是否存在
    if (!fs.existsSync(dirname)) {
      return null;
    }

    // 然后判断当前目录及上层目录是否存在cubit目录
    let currentDirs = fs.readdirSync(dirname, { withFileTypes: true });
    for (let i = 0; i < currentDirs.length; i++) {
      let itemDirent = currentDirs[i];
      let isDirectory = itemDirent.isDirectory();

      if (!isDirectory) {
        continue;
      }

      let fullItemPath = path.join(itemDirent.path, itemDirent.name);

      // 检查是否是目录且包含cubit
      if (itemDirent.name === "cubit") {
        currentCubitDir = fullItemPath;
        break;
      }
    }

    if (!currentCubitDir) {
      // 如果不存在则继续往上查询，直到根目录为止
      let parentDir = path.resolve(dirname, "..");

      // 防止无限递归，检查是否已经到达工作区根目录
      if (parentDir !== dirname && parentDir !== workSpaceDir) {
        let parentCubitDir = await checkAndCreateCubitDir(parentDir);
        currentCubitDir = parentCubitDir;
      }
    }

    // 如果存在则直接返回对应目录
    return currentCubitDir;
  } catch (error) {
    console.error("检查cubit目录时出错:", error);
    return null;
  }
}
