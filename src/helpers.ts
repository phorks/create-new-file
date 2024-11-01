import * as vscode from 'vscode';

class UIError implements Error {
    name = "UIError";
    message: string;
    stack?: string | undefined;
    cause?: unknown;

    constructor(message: string) {
        this.message = message;
    }
}

export async function fsExists(uri: vscode.Uri): Promise<boolean> {
    try {
        await vscode.workspace.fs.stat(uri);
        return true;
    } catch {
        return false;
    }
}

export async function fsStatOrUndefined(uri: vscode.Uri): Promise<vscode.FileStat | undefined> {
    try {
        const stat = await vscode.workspace.fs.stat(uri);
        return stat;
    } catch {
        return undefined;
    }
}