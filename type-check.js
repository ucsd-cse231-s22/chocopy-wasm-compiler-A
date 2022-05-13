"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.__esModule = true;
exports.tcLiteral = exports.tcExpr = exports.tcStmt = exports.tcBlock = exports.tcClass = exports.tcDef = exports.tcInit = exports.tc = exports.augmentTEnv = exports.join = exports.isAssignable = exports.isSubtype = exports.isNoneOrClass = exports.equalType = exports.emptyLocalTypeEnv = exports.emptyGlobalTypeEnv = exports.defaultTypeEnv = exports.TypeCheckError = void 0;
var ast_1 = require("./ast");
var utils_1 = require("./utils");
var FileTypeCheck_1 = require("./IO_File/FileTypeCheck");
// I ❤️ TypeScript: https://github.com/microsoft/TypeScript/issues/13965
var TypeCheckError = /** @class */ (function (_super) {
    __extends(TypeCheckError, _super);
    function TypeCheckError(message) {
        var _newTarget = this.constructor;
        var _this = this;
        var trueProto = _newTarget.prototype;
        _this = _super.call(this, "TYPE ERROR: " + message) || this;
        // Alternatively use Object.setPrototypeOf if you have an ES6 environment.
        _this.__proto__ = trueProto;
        return _this;
    }
    return TypeCheckError;
}(Error));
exports.TypeCheckError = TypeCheckError;
var defaultGlobalFunctions = new Map();
defaultGlobalFunctions.set("abs", [[utils_1.NUM], utils_1.NUM]);
defaultGlobalFunctions.set("max", [[utils_1.NUM, utils_1.NUM], utils_1.NUM]);
defaultGlobalFunctions.set("min", [[utils_1.NUM, utils_1.NUM], utils_1.NUM]);
defaultGlobalFunctions.set("pow", [[utils_1.NUM, utils_1.NUM], utils_1.NUM]);
defaultGlobalFunctions.set("print", [[utils_1.CLASS("object")], utils_1.NUM]);
exports.defaultTypeEnv = {
    globals: new Map(),
    functions: defaultGlobalFunctions,
    classes: new Map()
};
function emptyGlobalTypeEnv() {
    return {
        globals: new Map(),
        functions: new Map(),
        classes: new Map()
    };
}
exports.emptyGlobalTypeEnv = emptyGlobalTypeEnv;
function emptyLocalTypeEnv() {
    return {
        vars: new Map(),
        expectedRet: utils_1.NONE,
        actualRet: utils_1.NONE,
        topLevel: true
    };
}
exports.emptyLocalTypeEnv = emptyLocalTypeEnv;
function equalType(t1, t2) {
    return (t1 === t2 ||
        (t1.tag === "class" && t2.tag === "class" && t1.name === t2.name));
}
exports.equalType = equalType;
function isNoneOrClass(t) {
    return t.tag === "none" || t.tag === "class";
}
exports.isNoneOrClass = isNoneOrClass;
function isSubtype(env, t1, t2) {
    return equalType(t1, t2) || t1.tag === "none" && t2.tag === "class";
}
exports.isSubtype = isSubtype;
function isAssignable(env, t1, t2) {
    return isSubtype(env, t1, t2);
}
exports.isAssignable = isAssignable;
function join(env, t1, t2) {
    return utils_1.NONE;
}
exports.join = join;
function augmentTEnv(env, program) {
    var newGlobs = new Map(env.globals);
    var newFuns = new Map(env.functions);
    var newClasses = new Map(env.classes);
    program.inits.forEach(function (init) { return newGlobs.set(init.name, init.type); });
    program.funs.forEach(function (fun) { return newFuns.set(fun.name, [fun.parameters.map(function (p) { return p.type; }), fun.ret]); });
    newFuns = FileTypeCheck_1.addFileBuildinFuns(newFuns);
    program.classes.forEach(function (cls) {
        var fields = new Map();
        var methods = new Map();
        cls.fields.forEach(function (field) { return fields.set(field.name, field.type); });
        cls.methods.forEach(function (method) { return methods.set(method.name, [method.parameters.map(function (p) { return p.type; }), method.ret]); });
        newClasses.set(cls.name, [fields, methods]);
    });
    return { globals: newGlobs, functions: newFuns, classes: newClasses };
}
exports.augmentTEnv = augmentTEnv;
function tc(env, program) {
    var locals = emptyLocalTypeEnv();
    var newEnv = augmentTEnv(env, program);
    var tInits = program.inits.map(function (init) { return tcInit(env, init); });
    var tDefs = program.funs.map(function (fun) { return tcDef(newEnv, fun); });
    var tClasses = program.classes.map(function (cls) { return tcClass(newEnv, cls); });
    // program.inits.forEach(init => env.globals.set(init.name, tcInit(init)));
    // program.funs.forEach(fun => env.functions.set(fun.name, [fun.parameters.map(p => p.type), fun.ret]));
    // program.funs.forEach(fun => tcDef(env, fun));
    // Strategy here is to allow tcBlock to populate the locals, then copy to the
    // global env afterwards (tcBlock changes locals)
    var tBody = tcBlock(newEnv, locals, program.stmts);
    var lastTyp = utils_1.NONE;
    if (tBody.length) {
        lastTyp = tBody[tBody.length - 1].a;
    }
    // TODO(joe): check for assignment in existing env vs. new declaration
    // and look for assignment consistency
    for (var _i = 0, _a = locals.vars.keys(); _i < _a.length; _i++) {
        var name_1 = _a[_i];
        newEnv.globals.set(name_1, locals.vars.get(name_1));
    }
    var aprogram = { a: lastTyp, inits: tInits, funs: tDefs, classes: tClasses, stmts: tBody };
    return [aprogram, newEnv];
}
exports.tc = tc;
function tcInit(env, init) {
    var valTyp = tcLiteral(init.value);
    if (isAssignable(env, valTyp, init.type)) {
        return __assign(__assign({}, init), { a: utils_1.NONE });
    }
    else {
        throw new TypeCheckError("Expected type `" + init.type + "`; got type `" + valTyp + "`");
    }
}
exports.tcInit = tcInit;
function tcDef(env, fun) {
    var locals = emptyLocalTypeEnv();
    locals.expectedRet = fun.ret;
    locals.topLevel = false;
    fun.parameters.forEach(function (p) { return locals.vars.set(p.name, p.type); });
    fun.inits.forEach(function (init) { return locals.vars.set(init.name, tcInit(env, init).type); });
    var tBody = tcBlock(env, locals, fun.body);
    if (!isAssignable(env, locals.actualRet, locals.expectedRet))
        throw new TypeCheckError("expected return type of block: " + JSON.stringify(locals.expectedRet) + " does not match actual return type: " + JSON.stringify(locals.actualRet));
    return __assign(__assign({}, fun), { a: utils_1.NONE, body: tBody });
}
exports.tcDef = tcDef;
function tcClass(env, cls) {
    var tFields = cls.fields.map(function (field) { return tcInit(env, field); });
    var tMethods = cls.methods.map(function (method) { return tcDef(env, method); });
    var init = cls.methods.find(function (method) { return method.name === "__init__"; }); // we'll always find __init__
    if (init.parameters.length !== 1 ||
        init.parameters[0].name !== "self" ||
        !equalType(init.parameters[0].type, utils_1.CLASS(cls.name)) ||
        init.ret !== utils_1.NONE)
        throw new TypeCheckError("Cannot override __init__ type signature");
    return { a: utils_1.NONE, name: cls.name, fields: tFields, methods: tMethods };
}
exports.tcClass = tcClass;
function tcBlock(env, locals, stmts) {
    var tStmts = stmts.map(function (stmt) { return tcStmt(env, locals, stmt); });
    return tStmts;
}
exports.tcBlock = tcBlock;
function tcStmt(env, locals, stmt) {
    switch (stmt.tag) {
        case "assign":
            var tValExpr = tcExpr(env, locals, stmt.value);
            var nameTyp;
            if (locals.vars.has(stmt.name)) {
                nameTyp = locals.vars.get(stmt.name);
            }
            else if (env.globals.has(stmt.name)) {
                nameTyp = env.globals.get(stmt.name);
            }
            else {
                throw new TypeCheckError("Unbound id: " + stmt.name);
            }
            if (!isAssignable(env, tValExpr.a, nameTyp))
                throw new TypeCheckError("Non-assignable types");
            return { a: utils_1.NONE, tag: stmt.tag, name: stmt.name, value: tValExpr };
        case "expr":
            var tExpr = tcExpr(env, locals, stmt.expr);
            return { a: tExpr.a, tag: stmt.tag, expr: tExpr };
        case "if":
            var tCond = tcExpr(env, locals, stmt.cond);
            var tThn = tcBlock(env, locals, stmt.thn);
            var thnTyp = locals.actualRet;
            locals.actualRet = utils_1.NONE;
            var tEls = tcBlock(env, locals, stmt.els);
            var elsTyp = locals.actualRet;
            if (tCond.a !== utils_1.BOOL)
                throw new TypeCheckError("Condition Expression Must be a bool");
            if (thnTyp !== elsTyp)
                locals.actualRet = { tag: "either", left: thnTyp, right: elsTyp };
            return { a: thnTyp, tag: stmt.tag, cond: tCond, thn: tThn, els: tEls };
        case "return":
            if (locals.topLevel)
                throw new TypeCheckError("cannot return outside of functions");
            var tRet = tcExpr(env, locals, stmt.value);
            if (!isAssignable(env, tRet.a, locals.expectedRet))
                throw new TypeCheckError("expected return type `" + locals.expectedRet.tag + "`; got type `" + tRet.a.tag + "`");
            locals.actualRet = tRet.a;
            return { a: tRet.a, tag: stmt.tag, value: tRet };
        case "while":
            var tCond = tcExpr(env, locals, stmt.cond);
            var tBody = tcBlock(env, locals, stmt.body);
            if (!equalType(tCond.a, utils_1.BOOL))
                throw new TypeCheckError("Condition Expression Must be a bool");
            return { a: utils_1.NONE, tag: stmt.tag, cond: tCond, body: tBody };
        case "pass":
            return { a: utils_1.NONE, tag: stmt.tag };
        case "field-assign":
            var tObj = tcExpr(env, locals, stmt.obj);
            var tVal = tcExpr(env, locals, stmt.value);
            if (tObj.a.tag !== "class")
                throw new TypeCheckError("field assignments require an object");
            if (!env.classes.has(tObj.a.name))
                throw new TypeCheckError("field assignment on an unknown class");
            var _a = env.classes.get(tObj.a.name), fields = _a[0], _ = _a[1];
            if (!fields.has(stmt.field))
                throw new TypeCheckError("could not find field " + stmt.field + " in class " + tObj.a.name);
            if (!isAssignable(env, tVal.a, fields.get(stmt.field)))
                throw new TypeCheckError("could not assign value of type: " + tVal.a + "; field " + stmt.field + " expected type: " + fields.get(stmt.field));
            return __assign(__assign({}, stmt), { a: utils_1.NONE, obj: tObj, value: tVal });
    }
}
exports.tcStmt = tcStmt;
function tcExpr(env, locals, expr) {
    switch (expr.tag) {
        case "literal":
            return __assign(__assign({}, expr), { a: tcLiteral(expr.value) });
        case "binop":
            var tLeft = tcExpr(env, locals, expr.left);
            var tRight = tcExpr(env, locals, expr.right);
            var tBin = __assign(__assign({}, expr), { left: tLeft, right: tRight });
            switch (expr.op) {
                case ast_1.BinOp.Plus:
                case ast_1.BinOp.Minus:
                case ast_1.BinOp.Mul:
                case ast_1.BinOp.IDiv:
                case ast_1.BinOp.Mod:
                    if (equalType(tLeft.a, utils_1.NUM) && equalType(tRight.a, utils_1.NUM)) {
                        return __assign({ a: utils_1.NUM }, tBin);
                    }
                    else {
                        throw new TypeCheckError("Type mismatch for numeric op" + expr.op);
                    }
                case ast_1.BinOp.Eq:
                case ast_1.BinOp.Neq:
                    if (tLeft.a.tag === "class" || tRight.a.tag === "class")
                        throw new TypeCheckError("cannot apply operator '==' on class types");
                    if (equalType(tLeft.a, tRight.a)) {
                        return __assign({ a: utils_1.BOOL }, tBin);
                    }
                    else {
                        throw new TypeCheckError("Type mismatch for op" + expr.op);
                    }
                case ast_1.BinOp.Lte:
                case ast_1.BinOp.Gte:
                case ast_1.BinOp.Lt:
                case ast_1.BinOp.Gt:
                    if (equalType(tLeft.a, utils_1.NUM) && equalType(tRight.a, utils_1.NUM)) {
                        return __assign({ a: utils_1.BOOL }, tBin);
                    }
                    else {
                        throw new TypeCheckError("Type mismatch for op" + expr.op);
                    }
                case ast_1.BinOp.And:
                case ast_1.BinOp.Or:
                    if (equalType(tLeft.a, utils_1.BOOL) && equalType(tRight.a, utils_1.BOOL)) {
                        return __assign({ a: utils_1.BOOL }, tBin);
                    }
                    else {
                        throw new TypeCheckError("Type mismatch for boolean op" + expr.op);
                    }
                case ast_1.BinOp.Is:
                    if (!isNoneOrClass(tLeft.a) || !isNoneOrClass(tRight.a))
                        throw new TypeCheckError("is operands must be objects");
                    return __assign({ a: utils_1.BOOL }, tBin);
            }
        case "uniop":
            var tExpr = tcExpr(env, locals, expr.expr);
            var tUni = __assign(__assign({}, expr), { a: tExpr.a, expr: tExpr });
            switch (expr.op) {
                case ast_1.UniOp.Neg:
                    if (equalType(tExpr.a, utils_1.NUM)) {
                        return tUni;
                    }
                    else {
                        throw new TypeCheckError("Type mismatch for op" + expr.op);
                    }
                case ast_1.UniOp.Not:
                    if (equalType(tExpr.a, utils_1.BOOL)) {
                        return tUni;
                    }
                    else {
                        throw new TypeCheckError("Type mismatch for op" + expr.op);
                    }
            }
        case "id":
            if (locals.vars.has(expr.name)) {
                return __assign({ a: locals.vars.get(expr.name) }, expr);
            }
            else if (env.globals.has(expr.name)) {
                return __assign({ a: env.globals.get(expr.name) }, expr);
            }
            else {
                throw new TypeCheckError("Unbound id: " + expr.name);
            }
        case "builtin1":
            if (expr.name === "print") {
                var tArg = tcExpr(env, locals, expr.arg);
                return __assign(__assign({}, expr), { a: tArg.a, arg: tArg });
            }
            else if (env.functions.has(expr.name)) {
                var _a = env.functions.get(expr.name), expectedArgTyp = _a[0][0], retTyp = _a[1];
                var tArg = tcExpr(env, locals, expr.arg);
                if (isAssignable(env, tArg.a, expectedArgTyp)) {
                    return __assign(__assign({}, expr), { a: retTyp, arg: tArg });
                }
                else {
                    throw new TypeError("Function call type mismatch: " + expr.name);
                }
            }
            else {
                throw new TypeError("Undefined function: " + expr.name);
            }
        case "builtin2":
            if (env.functions.has(expr.name)) {
                var _b = env.functions.get(expr.name), _c = _b[0], leftTyp = _c[0], rightTyp = _c[1], retTyp = _b[1];
                var tLeftArg = tcExpr(env, locals, expr.left);
                var tRightArg = tcExpr(env, locals, expr.right);
                if (isAssignable(env, leftTyp, tLeftArg.a) && isAssignable(env, rightTyp, tRightArg.a)) {
                    return __assign(__assign({}, expr), { a: retTyp, left: tLeftArg, right: tRightArg });
                }
                else {
                    throw new TypeError("Function call type mismatch: " + expr.name);
                }
            }
            else {
                throw new TypeError("Undefined function: " + expr.name);
            }
        case "call":
            if (env.classes.has(expr.name)) {
                // surprise surprise this is actually a constructor
                var tConstruct = { a: utils_1.CLASS(expr.name), tag: "construct", name: expr.name };
                var _d = env.classes.get(expr.name), _ = _d[0], methods = _d[1];
                if (methods.has("__init__")) {
                    var _e = methods.get("__init__"), initArgs = _e[0], initRet = _e[1];
                    if (expr.arguments.length !== initArgs.length - 1)
                        throw new TypeCheckError("__init__ didn't receive the correct number of arguments from the constructor");
                    if (initRet !== utils_1.NONE)
                        throw new TypeCheckError("__init__  must have a void return type");
                    return tConstruct;
                }
                else {
                    return tConstruct;
                }
            }
            else if (env.functions.has(expr.name)) {
                var _f = env.functions.get(expr.name), argTypes_1 = _f[0], retType = _f[1];
                var tArgs_1 = expr.arguments.map(function (arg) { return tcExpr(env, locals, arg); });
                if (argTypes_1.length === expr.arguments.length &&
                    tArgs_1.every(function (tArg, i) { return tArg.a === argTypes_1[i]; })) {
                    return __assign(__assign({}, expr), { a: retType, arguments: expr.arguments });
                }
                else {
                    throw new TypeError("Function call type mismatch: " + expr.name);
                }
            }
            else {
                throw new TypeError("Undefined function: " + expr.name);
            }
        case "lookup":
            var tObj = tcExpr(env, locals, expr.obj);
            if (tObj.a.tag === "class") {
                if (env.classes.has(tObj.a.name)) {
                    var _g = env.classes.get(tObj.a.name), fields = _g[0], _ = _g[1];
                    if (fields.has(expr.field)) {
                        return __assign(__assign({}, expr), { a: fields.get(expr.field), obj: tObj });
                    }
                    else {
                        throw new TypeCheckError("could not found field " + expr.field + " in class " + tObj.a.name);
                    }
                }
                else {
                    throw new TypeCheckError("field lookup on an unknown class");
                }
            }
            else {
                throw new TypeCheckError("field lookups require an object");
            }
        case "method-call":
            var tObj = tcExpr(env, locals, expr.obj);
            var tArgs = expr.arguments.map(function (arg) { return tcExpr(env, locals, arg); });
            if (tObj.a.tag === "class") {
                if (env.classes.has(tObj.a.name)) {
                    var _h = env.classes.get(tObj.a.name), _ = _h[0], methods = _h[1];
                    if (methods.has(expr.method)) {
                        var _j = methods.get(expr.method), methodArgs = _j[0], methodRet = _j[1];
                        var realArgs_1 = [tObj].concat(tArgs);
                        if (methodArgs.length === realArgs_1.length &&
                            methodArgs.every(function (argTyp, i) { return isAssignable(env, realArgs_1[i].a, argTyp); })) {
                            return __assign(__assign({}, expr), { a: methodRet, obj: tObj, arguments: tArgs });
                        }
                        else {
                            throw new TypeCheckError("Method call type mismatch: " + expr.method + " --- callArgs: " + JSON.stringify(realArgs_1) + ", methodArgs: " + JSON.stringify(methodArgs));
                        }
                    }
                    else {
                        throw new TypeCheckError("could not found method " + expr.method + " in class " + tObj.a.name);
                    }
                }
                else {
                    throw new TypeCheckError("method call on an unknown class");
                }
            }
            else {
                throw new TypeCheckError("method calls require an object");
            }
        default: throw new TypeCheckError("unimplemented type checking for expr: " + expr);
    }
}
exports.tcExpr = tcExpr;
function tcLiteral(literal) {
    switch (literal.tag) {
        case "bool": return utils_1.BOOL;
        case "num": return utils_1.NUM;
        case "none": return utils_1.NONE;
    }
}
exports.tcLiteral = tcLiteral;
