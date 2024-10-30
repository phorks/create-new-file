// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Picker } from './picker';
import path from 'path';
import { Config } from './config';

export function activate(context: vscode.ExtensionContext) {
	let activePicker: Picker | undefined;

	const disposable = vscode.commands.registerCommand('createNewFile.createNewFile', (currentFile: string) => {
		vscode.window.showInformationMessage(context.workspaceState.keys().join(", "));
		activePicker = new Picker(
			path.dirname(vscode.window.activeTextEditor!.document.uri.fsPath),
			vscode.workspace.workspaceFolders![0].uri.fsPath,
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
