import CodeMirror from "codemirror";


export function autocompleteHint(editor: any, keywords: string[], getToken: any) {
    // Find the token at the cursor
    var currPos = editor.getCursor();
    var token = getToken(editor, currPos),
        tprop = token;
    var isClassMethod = false;
    if (token.string[token.string.length - 1] === ".") {
        isClassMethod = true;
        token = tprop = {
            start: currPos.ch,
            end: currPos.ch,
            string: "",
            state: token.state,
            type: "property",
        };
    } else if (token.type == "property") {
        isClassMethod = true;
    }
    //ignore any non word or property token
    else if (!/^[\w$_]*$/.test(token.string)) {
        token = tprop = {
            start: currPos.ch,
            end: currPos.ch,
            string: "",
            state: token.state,
            className: token.string == ":" ? "python-type" : null,
        };
    }

    if (!context || isClassMethod) {
        var context = [];
        context.push(tprop);

        var completionList = getCompletions(keywords, token, context);
        completionList = completionList.sort();
        //show dropdown with one word (restrict automatic autocomplete of single word)
        if (completionList.length == 1) {
            completionList.push(" ");
        }
    }
    return {
        list: completionList,
        from: CodeMirror.Pos(currPos.line, token.start),
        to: CodeMirror.Pos(currPos.line, token.end),
    };
}

function getCompletions(wordList: any, token: any, context: any) {
    var completions: any[] = [];
    var prefix = token.string;

    if (context) {
        // If this is a property, see if it belongs to some object we can
        // find in the current environment.
        var obj = context.pop(),
            base;

        const hasCompleteList: Array<string> = ["variable", "property", "builtin", "keyword"];
        if (hasCompleteList.indexOf(obj.type) !== -1) {
            base = obj.string;
        }

        while (base != null && context.length) {
            base = base[context.pop().string];
        }
        if (base != null) {
            completions = gatherCompletions(wordList, prefix);
        }
    }
    return completions;
}

function gatherCompletions(wordList: string[], prefix: string): string[] {
    var completions: string[] = [];
    for (var i = 0; i < wordList.length; i++) {
        var str = wordList[i];
        //only add word if not already in array and prefix matches word
        if (str.indexOf(prefix) == 0 && !strExists(completions, str)) {
            completions.push(str);
        }
    }
    return completions;
}

function strExists(arr: string[], item: string) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == item) {
            return true;
        }
    }
    return false;
}
