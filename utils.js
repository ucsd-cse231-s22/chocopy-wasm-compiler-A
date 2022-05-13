"use strict";
exports.__esModule = true;
exports.CLASS = exports.NONE = exports.BOOL = exports.NUM = exports.PyNone = exports.PyObj = exports.PyBool = exports.PyInt = exports.PyValue = void 0;
function PyValue(typ, result) {
    switch (typ.tag) {
        case "number":
            return PyInt(result);
        case "bool":
            return PyBool(Boolean(result));
        case "class":
            return PyObj(typ.name, result);
        case "none":
            return PyNone();
    }
}
exports.PyValue = PyValue;
function PyInt(n) {
    return { tag: "num", value: n };
}
exports.PyInt = PyInt;
function PyBool(b) {
    return { tag: "bool", value: b };
}
exports.PyBool = PyBool;
function PyObj(name, address) {
    if (address === 0)
        return PyNone();
    else
        return { tag: "object", name: name, address: address };
}
exports.PyObj = PyObj;
function PyNone() {
    return { tag: "none" };
}
exports.PyNone = PyNone;
exports.NUM = { tag: "number" };
exports.BOOL = { tag: "bool" };
exports.NONE = { tag: "none" };
function CLASS(name) { return { tag: "class", name: name }; }
exports.CLASS = CLASS;
;
