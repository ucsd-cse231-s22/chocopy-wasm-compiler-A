"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.lowerProgram = void 0;
var FileParser_1 = require("./IO_File/FileParser");
var nameCounters = new Map();
function generateName(base) {
    if (nameCounters.has(base)) {
        var cur = nameCounters.get(base);
        nameCounters.set(base, cur + 1);
        return base + (cur + 1);
    }
    else {
        nameCounters.set(base, 1);
        return base + 1;
    }
}
// function lbl(a: Type, base: string) : [string, IR.Stmt<Type>] {
//   const name = generateName(base);
//   return [name, {tag: "label", a: a, name: name}];
// }
function lowerProgram(p, env) {
    p.classes.push(FileParser_1.FileClass);
    p.funs.push(FileParser_1.OpenFun);
    var blocks = [];
    var firstBlock = { a: p.a, label: generateName("$startProg"), stmts: [] };
    blocks.push(firstBlock);
    var inits = flattenStmts(p.stmts, blocks, env);
    return {
        a: p.a,
        funs: lowerFunDefs(p.funs, env),
        inits: __spreadArrays(inits, lowerVarInits(p.inits, env)),
        classes: lowerClasses(p.classes, env),
        body: blocks
    };
}
exports.lowerProgram = lowerProgram;
function lowerFunDefs(fs, env) {
    return fs.map(function (f) { return lowerFunDef(f, env); }).flat();
}
function lowerFunDef(f, env) {
    var blocks = [];
    var firstBlock = { a: f.a, label: generateName("$startFun"), stmts: [] };
    blocks.push(firstBlock);
    var bodyinits = flattenStmts(f.body, blocks, env);
    return __assign(__assign({}, f), { inits: __spreadArrays(bodyinits, lowerVarInits(f.inits, env)), body: blocks });
}
function lowerVarInits(inits, env) {
    return inits.map(function (i) { return lowerVarInit(i, env); });
}
function lowerVarInit(init, env) {
    return __assign(__assign({}, init), { value: literalToVal(init.value) });
}
function lowerClasses(classes, env) {
    return classes.map(function (c) { return lowerClass(c, env); });
}
function lowerClass(cls, env) {
    return __assign(__assign({}, cls), { fields: lowerVarInits(cls.fields, env), methods: lowerFunDefs(cls.methods, env) });
}
function literalToVal(lit) {
    switch (lit.tag) {
        case "num":
            return __assign(__assign({}, lit), { value: BigInt(lit.value) });
        case "bool":
            return lit;
        case "none":
            return lit;
    }
}
function flattenStmts(s, blocks, env) {
    var inits = [];
    s.forEach(function (stmt) {
        inits.push.apply(inits, flattenStmt(stmt, blocks, env));
    });
    return inits;
}
function flattenStmt(s, blocks, env) {
    var _a, _b, _c;
    switch (s.tag) {
        case "assign":
            var _d = flattenExprToExpr(s.value, env), valinits = _d[0], valstmts = _d[1], vale = _d[2];
            (_a = blocks[blocks.length - 1].stmts).push.apply(_a, __spreadArrays(valstmts, [{ a: s.a, tag: "assign", name: s.name, value: vale }]));
            return valinits;
        // return [valinits, [
        //   ...valstmts,
        //   { a: s.a, tag: "assign", name: s.name, value: vale}
        // ]];
        case "return":
            var _e = flattenExprToVal(s.value, env), valinits = _e[0], valstmts = _e[1], val = _e[2];
            (_b = blocks[blocks.length - 1].stmts).push.apply(_b, __spreadArrays(valstmts, [{ tag: "return", a: s.a, value: val }]));
            return valinits;
        // return [valinits, [
        //     ...valstmts,
        //     {tag: "return", a: s.a, value: val}
        // ]];
        case "expr":
            var _f = flattenExprToExpr(s.expr, env), inits = _f[0], stmts = _f[1], e = _f[2];
            (_c = blocks[blocks.length - 1].stmts).push.apply(_c, __spreadArrays(stmts, [{ tag: "expr", a: s.a, expr: e }]));
            return inits;
        //  return [inits, [ ...stmts, {tag: "expr", a: s.a, expr: e } ]];
        case "pass":
            return [];
        case "field-assign": {
            var _g = flattenExprToVal(s.obj, env), oinits = _g[0], ostmts = _g[1], oval = _g[2];
            var _h = flattenExprToVal(s.value, env), ninits = _h[0], nstmts = _h[1], nval = _h[2];
            if (s.obj.a.tag !== "class") {
                throw new Error("Compiler's cursed, go home.");
            }
            var classdata = env.classes.get(s.obj.a.name);
            var offset = { tag: "wasmint", value: classdata.get(s.field)[0] };
            pushStmtsToLastBlock.apply(void 0, __spreadArrays([blocks], ostmts, nstmts, [{
                    tag: "store",
                    a: s.a,
                    start: oval,
                    offset: offset,
                    value: nval
                }]));
            return __spreadArrays(oinits, ninits);
        }
        // return [[...oinits, ...ninits], [...ostmts, ...nstmts, {
        //   tag: "field-assign",
        //   a: s.a,
        //   obj: oval,
        //   field: s.field,
        //   value: nval
        // }]];
        case "if":
            var thenLbl = generateName("$then");
            var elseLbl = generateName("$else");
            var endLbl = generateName("$end");
            var endjmp = { tag: "jmp", lbl: endLbl };
            var _j = flattenExprToVal(s.cond, env), cinits = _j[0], cstmts = _j[1], cexpr = _j[2];
            var condjmp = { tag: "ifjmp", cond: cexpr, thn: thenLbl, els: elseLbl };
            pushStmtsToLastBlock.apply(void 0, __spreadArrays([blocks], cstmts, [condjmp]));
            blocks.push({ a: s.a, label: thenLbl, stmts: [] });
            var theninits = flattenStmts(s.thn, blocks, env);
            pushStmtsToLastBlock(blocks, endjmp);
            blocks.push({ a: s.a, label: elseLbl, stmts: [] });
            var elseinits = flattenStmts(s.els, blocks, env);
            pushStmtsToLastBlock(blocks, endjmp);
            blocks.push({ a: s.a, label: endLbl, stmts: [] });
            return __spreadArrays(cinits, theninits, elseinits);
        // return [[...cinits, ...theninits, ...elseinits], [
        //   ...cstmts, 
        //   condjmp,
        //   startlbl,
        //   ...thenstmts,
        //   endjmp,
        //   elslbl,
        //   ...elsestmts,
        //   endjmp,
        //   endlbl,
        // ]];
        case "while":
            var whileStartLbl = generateName("$whilestart");
            var whilebodyLbl = generateName("$whilebody");
            var whileEndLbl = generateName("$whileend");
            pushStmtsToLastBlock(blocks, { tag: "jmp", lbl: whileStartLbl });
            blocks.push({ a: s.a, label: whileStartLbl, stmts: [] });
            var _k = flattenExprToVal(s.cond, env), cinits = _k[0], cstmts = _k[1], cexpr = _k[2];
            pushStmtsToLastBlock.apply(void 0, __spreadArrays([blocks], cstmts, [{ tag: "ifjmp", cond: cexpr, thn: whilebodyLbl, els: whileEndLbl }]));
            blocks.push({ a: s.a, label: whilebodyLbl, stmts: [] });
            var bodyinits = flattenStmts(s.body, blocks, env);
            pushStmtsToLastBlock(blocks, { tag: "jmp", lbl: whileStartLbl });
            blocks.push({ a: s.a, label: whileEndLbl, stmts: [] });
            return __spreadArrays(cinits, bodyinits);
    }
}
function flattenExprToExpr(e, env) {
    switch (e.tag) {
        case "uniop":
            var _a = flattenExprToVal(e.expr, env), inits = _a[0], stmts = _a[1], val = _a[2];
            return [inits, stmts, __assign(__assign({}, e), { expr: val })];
        case "binop":
            var _b = flattenExprToVal(e.left, env), linits = _b[0], lstmts = _b[1], lval = _b[2];
            var _c = flattenExprToVal(e.right, env), rinits = _c[0], rstmts = _c[1], rval = _c[2];
            return [__spreadArrays(linits, rinits), __spreadArrays(lstmts, rstmts), __assign(__assign({}, e), { left: lval, right: rval })];
        case "builtin1":
            var _d = flattenExprToVal(e.arg, env), inits = _d[0], stmts = _d[1], val = _d[2];
            return [inits, stmts, { tag: "builtin1", a: e.a, name: e.name, arg: val }];
        case "builtin2":
            var _e = flattenExprToVal(e.left, env), linits = _e[0], lstmts = _e[1], lval = _e[2];
            var _f = flattenExprToVal(e.right, env), rinits = _f[0], rstmts = _f[1], rval = _f[2];
            return [__spreadArrays(linits, rinits), __spreadArrays(lstmts, rstmts), __assign(__assign({}, e), { left: lval, right: rval })];
        case "call":
            var callpairs = e.arguments.map(function (a) { return flattenExprToVal(a, env); });
            var callinits = callpairs.map(function (cp) { return cp[0]; }).flat();
            var callstmts = callpairs.map(function (cp) { return cp[1]; }).flat();
            var callvals = callpairs.map(function (cp) { return cp[2]; }).flat();
            return [callinits, callstmts, __assign(__assign({}, e), { arguments: callvals })];
        case "method-call": {
            var _g = flattenExprToVal(e.obj, env), objinits = _g[0], objstmts = _g[1], objval = _g[2];
            var argpairs = e.arguments.map(function (a) { return flattenExprToVal(a, env); });
            var arginits = argpairs.map(function (cp) { return cp[0]; }).flat();
            var argstmts = argpairs.map(function (cp) { return cp[1]; }).flat();
            var argvals = argpairs.map(function (cp) { return cp[2]; }).flat();
            var objTyp = e.obj.a;
            if (objTyp.tag !== "class") { // I don't think this error can happen
                throw new Error("Report this as a bug to the compiler developer, this shouldn't happen " + objTyp.tag);
            }
            var className = objTyp.name;
            var checkObj = { tag: "expr", expr: { tag: "call", name: "assert_not_none", arguments: [objval] } };
            var callMethod = { tag: "call", name: className + "$" + e.method, arguments: __spreadArrays([objval], argvals) };
            return [
                __spreadArrays(objinits, arginits),
                __spreadArrays(objstmts, [checkObj], argstmts),
                callMethod
            ];
        }
        case "lookup": {
            var _h = flattenExprToVal(e.obj, env), oinits = _h[0], ostmts = _h[1], oval = _h[2];
            if (e.obj.a.tag !== "class") {
                throw new Error("Compiler's cursed, go home");
            }
            var classdata_1 = env.classes.get(e.obj.a.name);
            var _j = classdata_1.get(e.field), offset = _j[0], _ = _j[1];
            return [oinits, ostmts, {
                    tag: "load",
                    start: oval,
                    offset: { tag: "wasmint", value: offset }
                }];
        }
        case "construct":
            var classdata = env.classes.get(e.name);
            var fields = __spreadArrays(classdata.entries());
            var newName_1 = generateName("newObj");
            var alloc = { tag: "alloc", amount: { tag: "wasmint", value: fields.length } };
            var assigns = fields.map(function (f) {
                var _ = f[0], _a = f[1], index = _a[0], value = _a[1];
                return {
                    tag: "store",
                    start: { tag: "id", name: newName_1 },
                    offset: { tag: "wasmint", value: index },
                    value: value
                };
            });
            return [
                [{ name: newName_1, type: e.a, value: { tag: "none" } }],
                __spreadArrays([{ tag: "assign", name: newName_1, value: alloc }], assigns, [{ tag: "expr", expr: { tag: "call", name: e.name + "$__init__", arguments: [{ a: e.a, tag: "id", name: newName_1 }] } }]),
                { a: e.a, tag: "value", value: { a: e.a, tag: "id", name: newName_1 } }
            ];
        case "id":
            return [[], [], { tag: "value", value: __assign({}, e) }];
        case "literal":
            return [[], [], { tag: "value", value: literalToVal(e.value) }];
    }
}
function flattenExprToVal(e, env) {
    var _a = flattenExprToExpr(e, env), binits = _a[0], bstmts = _a[1], bexpr = _a[2];
    if (bexpr.tag === "value") {
        return [binits, bstmts, bexpr.value];
    }
    else {
        var newName = generateName("valname");
        var setNewName = {
            tag: "assign",
            a: e.a,
            name: newName,
            value: bexpr
        };
        // TODO: we have to add a new var init for the new variable we're creating here.
        // but what should the default value be?
        return [
            __spreadArrays(binits, [{ a: e.a, name: newName, type: e.a, value: { tag: "none" } }]),
            __spreadArrays(bstmts, [setNewName]),
            { tag: "id", name: newName, a: e.a }
        ];
    }
}
function pushStmtsToLastBlock(blocks) {
    var _a;
    var stmts = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        stmts[_i - 1] = arguments[_i];
    }
    (_a = blocks[blocks.length - 1].stmts).push.apply(_a, stmts);
}
