type char = string;

function appendBefore(mid: char[], paths: char[][]): char[][] {
    if (paths.length === 0) {
        return [mid];
    }

    if (mid.length === 0) {
        return paths;
    }

    return paths.map(x => [...mid, ...x]);
}

function appendAfter(mid: char[], paths: char[][]): char[][] {
    if (paths.length === 0) {
        return [mid];
    }

    if (mid.length === 0) {
        return paths;
    }

    return paths.map(x => [...x, ...mid]);
}

export function expandPath(input: string): string[] {
    const paths: string[] = [];
    let pathsStack: char[][][] = [];
    let groupStack: char[][][] = [];

    let midPath: char[] = [];
    let currentPaths: char[][] = [];
    let currentGroup: char[][] = [];

    const appendLastGroupItems = () => {
        const partPaths = appendAfter(midPath, currentPaths);
        currentGroup.push(...partPaths);
        midPath = [];
        currentPaths = [];
    };

    for (let i = 0; i < input.length; i++) {
        const ch = input.charAt(i);
        if (ch === '{') {
            pathsStack.push(appendAfter(midPath, currentPaths));
            groupStack.push(currentGroup);

            midPath = [];
            currentGroup = [];
            currentPaths = [];
        } else if (ch === '}') {
            if (pathsStack.length === 0) {
                // unmatched } s
                return [input];
            }

            appendLastGroupItems();

            const oldPaths = pathsStack.pop()!;
            const oldGroup = groupStack.pop()!;

            currentPaths = oldPaths.flatMap(x => currentGroup.map(y => [...x, ...y]));
            currentGroup = oldGroup;
        } else if (ch === ',' && pathsStack.length > 0 /* indicates that we are inside { } */) {
            if (i + 1 < input.length && input.charAt(i + 1) === ',') {
                midPath.push(',');
                i++;
                continue;
            }

            appendLastGroupItems();
        } else {
            midPath.push(ch);
        }

    }

    if (pathsStack.length !== 0) {
        // unmatched { s
        return [input];
    }

    currentPaths = appendAfter(midPath, currentPaths);
    return currentPaths.map(x => x.join(""));
}