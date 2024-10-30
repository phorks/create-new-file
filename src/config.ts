import path from "path";
import { WorkspaceConfiguration } from "vscode";

export class Config {
    config: WorkspaceConfiguration;

    constructor(config: WorkspaceConfiguration) {
        this.config = config;
    }

    get sep(): string {
        switch (this.config.get<string>("preferredSeparator")) {
            case "slash":
                return '/';
            case "backslash":
                return '\\';
            default:
                return path.sep;
        }
    }

    get otherSep(): string {
        return this.sep === '/' ? '\\' : '/';
    }

    fixPathSeps(path: string) {
        return path.replaceAll(this.otherSep, this.sep);
    }

    isAnySep(char: string): boolean {
        return char === '/' || char === '\\';
    }
}