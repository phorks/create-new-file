// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Picker } from './picker';
import path from 'path';
import { Config } from './config';
import { fsStatOrUndefined } from './helpers';

export function activate(context: vscode.ExtensionContext) {
	let activePicker: Picker | undefined;

	const disposable = vscode.commands.registerCommand('createNewFile.createNewFile', async (resource?: vscode.Uri) => {
		if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
			await vscode.window.showErrorMessage("Create New File can only be used inside a workspace.");
		}

		let startingPath: string | undefined;
		if (resource) {
			let fileUri: vscode.Uri | undefined;
			if (resource instanceof vscode.Uri) {
				fileUri = resource;
			} else if ((resource as any).resourceUri) {
				fileUri = (resource as any).resourceUri as vscode.Uri;
			}

			if (fileUri) {
				const stat = await fsStatOrUndefined(fileUri);
				if (stat) {
					switch (stat.type) {
						case vscode.FileType.File:
							startingPath = path.dirname(fileUri.fsPath);
							break;
						case vscode.FileType.Directory:
							startingPath = fileUri.fsPath;
							break;
					}
				}
			}
		}

		const workspacePath = vscode.workspace.workspaceFolders![0].uri.fsPath;

		if (!startingPath) {
			const activeEditor = vscode.window.activeTextEditor;
			startingPath = activeEditor ? path.dirname(activeEditor.document.uri.fsPath) : workspacePath;
		}

		activePicker = new Picker(
			startingPath,
			workspacePath,
			new Config(vscode.workspace.getConfiguration("createNewFile")),
			context
		);
		activePicker.show();
	});

	const acceptSuggestion = vscode.commands.registerCommand('createNewFile.acceptSuggestion', () => {
		if (!activePicker) {
			return;
		}

		activePicker.acceptSuggestion();
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(acceptSuggestion);
}

// This method is called when your extension is deactivated
export function deactivate() { }
