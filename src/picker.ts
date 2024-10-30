// eslint-disable-next-line @typescript-eslint/naming-convention
import _ from 'lodash';
import * as path from 'path';
import * as vscode from 'vscode';
import { QuickPick, QuickPickItem } from "vscode";
import { Config } from './config';
import { fsExists } from './helpers';

enum PickerItemTargetKind {
    Suggestion,
    File,
    Folder
}

interface PickerItem extends vscode.QuickPickItem {
    targetKind: PickerItemTargetKind
}

interface PickerItemSeparator extends vscode.QuickPickItem {
    kind: vscode.QuickPickItemKind.Separator,
    label: 'Folders'
}

type PickerItemType = PickerItem | PickerItemSeparator;

export class Picker {
    private static readonly STATE_KEY = "NewFile_Active_Picker";

    private readonly qp: QuickPick<PickerItemType>;
    private readonly startingPath: string;
    private readonly workspacePath: string;
    private readonly config: Config;
    private readonly context: vscode.ExtensionContext;
    private mainItem: PickerItem | undefined;
    private oldInput: string;
    private pathDirItems: PickerItem[] = [];
    private pathParts: string[] = [];
    private lastSuggestionItem: PickerItem | undefined;
    private fullPath: string | undefined;

    constructor(startingPath: string, workspacePath: string, config: Config, context: vscode.ExtensionContext) {
        this.oldInput = "";
        this.qp = vscode.window.createQuickPick();
        this.qp.onDidHide(this.onHide.bind(this));
        this.qp.onDidChangeValue(this.onValueChanged.bind(this));
        this.qp.onDidAccept(this.onAccepted.bind(this));
        this.qp.onDidChangeActive(this.onActiveChanged.bind(this));

        if (startingPath === workspacePath) {
            this.qp.placeholder = `Add new file (relative to the workspace root)`;
        } else {
            this.qp.placeholder = `Add new file (relative to '~${config.sep}${config.fixPathSeps(path.relative(workspacePath, startingPath))}'; begin with '~${config.sep}' to start from the workspace root)`;
        }
        this.startingPath = startingPath;
        this.workspacePath = workspacePath;
        this.config = config;
        this.context = context;
    }

    public show() {
        this.qp.show();
    }

    public acceptSuggestion() {
        if (!this.lastSuggestionItem) {
            return;
        }

        this.qp.value = this.getSuggestionPath(this.qp.value, this.lastSuggestionItem.label);
    }

    private onHide() {
        this.qp.dispose();
        this.setSuggestionAvailableContext(false);
    }

    private async onValueChanged(input: string) {
        if (input.length === 0) {
            this.mainItem = undefined;
            this.oldInput = "";
            this.qp.items = [];
            return;
        }

        if (input === this.oldInput) {
            return;
        }

        if (this.oldInput === 'temp/') {
            console.log("Hi");
        }

        if (this.config.isAnySep(input.at(-1)!)
            && input.slice(0, -1) === this.oldInput
            && this.lastSuggestionItem
            && this.pathDirItems.includes(this.lastSuggestionItem!)
        ) {
            const oldInput = this.oldInput;
            this.oldInput = input;
            this.qp.value = this.getSuggestionPath(oldInput, this.lastSuggestionItem.label);
            return;
        }

        let dir = this.startingPath;
        let fullPath: string;
        if (input.length >= 2 && input.charAt(0) === '~' && this.config.isAnySep(input.charAt(1))) {
            fullPath = path.join(this.workspacePath, input.substring(2));
        } else {
            fullPath = path.join(this.startingPath, input);
        }

        const isFolder = this.config.isAnySep(input.at(-1)!);
        this.mainItem = {
            label: '~' + this.config.sep + this.config.fixPathSeps(path.relative(this.workspacePath, fullPath)),
            alwaysShow: true,
            targetKind: isFolder ? PickerItemTargetKind.Folder : PickerItemTargetKind.File,
            iconPath: new vscode.ThemeIcon(isFolder ? "new-folder" : "new-file")
        };

        const pathParts = input.split(/[\\\/]/);
        let dirItems: PickerItem[] = [];

        if (pathParts.length > 1
            && !_.isEqual(pathParts.slice(0, -1), this.pathParts.slice(0, -1))) {

            // if the last part is empty, the input has ended with a sep, so the full name is a directory name
            const dirName = pathParts.at(-1) === '' ? fullPath : path.dirname(fullPath);
            try {
                this.pathDirItems = (await vscode.workspace.fs.readDirectory(vscode.Uri.file(dirName)))
                    .filter(x => x[1] === vscode.FileType.Directory)
                    .map(x => <PickerItem>{
                        label: x[0],
                        iconPath: vscode.ThemeIcon.Folder,
                        targetKind: PickerItemTargetKind.Suggestion,
                        alwaysShow: true,
                    });
            } catch {
                // the directory does not exists
                this.pathDirItems = [];
            }
        }

        if (pathParts.length > 1 && this.pathDirItems.length > 0) {
            dirItems = this.pathDirItems.filter(x => x.label.startsWith(pathParts.at(-1)!));
        }

        this.fullPath = fullPath;
        this.oldInput = input;
        this.qp.items = [this.mainItem, ...dirItems.length > 0
            ? [<PickerItemSeparator>{ label: "Folders", kind: vscode.QuickPickItemKind.Separator }, ...dirItems]
            : []];
    }

    private async onAccepted() {
        if (this.qp.selectedItems.length === 0) {
            return;
        }

        const selected = this.qp.selectedItems[0];

        if (selected.kind === vscode.QuickPickItemKind.Separator) {
            return;
        }

        if (selected.targetKind !== PickerItemTargetKind.Suggestion) {
            if (!this.fullPath) {
                return;
            }

            const fullUri = vscode.Uri.file(this.fullPath);
            const isFolder = selected.targetKind === PickerItemTargetKind.Folder;

            if (await fsExists(fullUri)) {
                vscode.window.showInformationMessage(`The ${isFolder ? "folder" : "file"} already exists.`);
                this.qp.hide();
                return;
            }

            if (isFolder) {
                try {
                    await vscode.workspace.fs.createDirectory(fullUri);
                } catch (err) {
                    await vscode.window.showErrorMessage("Unable to create folder.");
                }
            } else {
                try {
                    await vscode.workspace.fs.createDirectory(vscode.Uri.file(path.dirname(this.fullPath)));
                    await vscode.workspace.fs.writeFile(fullUri, new Uint8Array());
                    await vscode.window.showTextDocument(fullUri, { preview: false, viewColumn: vscode.ViewColumn.Active });
                } catch (err) {
                    await vscode.window.showErrorMessage("Unable to create file.");
                }
            }

            this.qp.hide();
        } else {
            this.qp.value = this.getSuggestionPath(this.qp.value, selected.label);
        }
    }

    private onActiveChanged(items: readonly PickerItemType[]): any {
        if (items.length > 0 && items[0].kind !== vscode.QuickPickItemKind.Separator
            && items[0].targetKind === PickerItemTargetKind.Suggestion
        ) {
            this.lastSuggestionItem = items[0];
            this.setSuggestionAvailableContext(true);
        } else {
            this.setSuggestionAvailableContext(false);
        }
    }

    private setSuggestionAvailableContext(isAvailable: boolean) {
        vscode.commands.executeCommand("setContext", "createNewFile.suggestionAvailable", isAvailable);
    }


    private getSuggestionPath(input: string, suggestion: string) {
        const dir = input.match(/.*[\\\/](?=[^\\\/]*$)/)?.[0];
        return dir + suggestion + this.config.sep;
    }
}