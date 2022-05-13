"use strict";
exports.__esModule = true;
exports.stringifyTree = void 0;
function stringifyTree(t, source, d) {
    var str = "";
    var spaces = " ".repeat(d * 2);
    str += spaces + t.type.name;
    if (["Number", "CallExpression", "BinaryExpression", "UnaryExpression", "ArithOp", "VariableName"].includes(t.type.name)) {
        str += " --> " + source.substring(t.from, t.to);
    }
    str += "\n";
    if (t.firstChild()) {
        do {
            str += stringifyTree(t, source, d + 1);
        } while (t.nextSibling());
        t.parent();
    }
    return str;
}
exports.stringifyTree = stringifyTree;
