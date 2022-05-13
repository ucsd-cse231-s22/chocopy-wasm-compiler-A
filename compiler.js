"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.compile = exports.makeLocals = exports.emptyEnv = void 0;
var ast_1 = require("./ast");
var utils_1 = require("./utils");
exports.emptyEnv = {
    globals: new Map(),
    classes: new Map(),
    locals: new Set(),
    labels: [],
    offset: 0
};
function makeLocals(locals) {
    var localDefines = [];
    locals.forEach(function (v) {
        localDefines.push("(local $" + v + " i32)");
    });
    return localDefines;
}
exports.makeLocals = makeLocals;
function compile(ast, env) {
    var withDefines = env;
    var definedVars = new Set(); //getLocals(ast);
    definedVars.add("$last");
    definedVars.add("$selector");
    definedVars.forEach(env.locals.add, env.locals);
    var localDefines = makeLocals(definedVars);
    var globalNames = ast.inits.map(function (init) { return init.name; });
    console.log(ast.inits, globalNames);
    var funs = [];
    ast.funs.forEach(function (f) {
        funs.push(codeGenDef(f, withDefines).join("\n"));
    });
    var classes = ast.classes.map(function (cls) { return codeGenClass(cls, withDefines); }).flat();
    var allFuns = funs.concat(classes).join("\n\n");
    // const stmts = ast.filter((stmt) => stmt.tag !== "fun");
    var inits = ast.inits.map(function (init) { return codeGenInit(init, withDefines); }).flat();
    withDefines.labels = ast.body.map(function (block) { return block.label; });
    var bodyCommands = "(local.set $$selector (i32.const 0))\n";
    bodyCommands += "(loop $loop\n";
    var blockCommands = "(local.get $$selector)\n";
    blockCommands += "(br_table " + ast.body.map(function (block) { return block.label; }).join(" ") + ")";
    ast.body.forEach(function (block) {
        blockCommands = "(block " + block.label + "\n              " + blockCommands + "    \n            ) ;; end " + block.label + "\n            " + block.stmts.map(function (stmt) { return codeGenStmt(stmt, withDefines).join('\n'); }).join('\n') + "\n            ";
    });
    bodyCommands += blockCommands;
    bodyCommands += ") ;; end $loop";
    // const commandGroups = ast.stmts.map((stmt) => codeGenStmt(stmt, withDefines));
    var allCommands = __spreadArrays(localDefines, inits, [bodyCommands]);
    withDefines.locals.clear();
    return {
        globals: globalNames,
        functions: allFuns,
        mainSource: allCommands.join("\n"),
        newEnv: withDefines
    };
}
exports.compile = compile;
function codeGenStmt(stmt, env) {
    switch (stmt.tag) {
        case "store":
            return __spreadArrays(codeGenValue(stmt.start, env), codeGenValue(stmt.offset, env), codeGenValue(stmt.value, env), [
                "call $store"
            ]);
        case "assign":
            var valStmts = codeGenExpr(stmt.value, env);
            if (env.locals.has(stmt.name)) {
                return valStmts.concat(["(local.set $" + stmt.name + ")"]);
            }
            else {
                return valStmts.concat(["(global.set $" + stmt.name + ")"]);
            }
        case "return":
            var valStmts = codeGenValue(stmt.value, env);
            valStmts.push("return");
            return valStmts;
        case "expr":
            var exprStmts = codeGenExpr(stmt.expr, env);
            return exprStmts.concat(["(local.set $$last)"]);
        case "pass":
            return [];
        case "ifjmp":
            var thnIdx = env.labels.findIndex(function (e) { return e === stmt.thn; });
            var elsIdx = env.labels.findIndex(function (e) { return e === stmt.els; });
            return __spreadArrays(codeGenValue(stmt.cond, env), ["(if \n          (then\n            (local.set $$selector (i32.const " + thnIdx + "))\n            (br $loop)\n          ) \n          (else \n            (local.set $$selector (i32.const " + elsIdx + "))\n            (br $loop)\n          )\n         )"]);
        case "jmp":
            var lblIdx = env.labels.findIndex(function (e) { return e === stmt.lbl; });
            return ["(local.set $$selector (i32.const " + lblIdx + "))", "(br $loop)"];
    }
}
function codeGenExpr(expr, env) {
    switch (expr.tag) {
        case "value":
            return codeGenValue(expr.value, env);
        case "binop":
            var lhsStmts = codeGenValue(expr.left, env);
            var rhsStmts = codeGenValue(expr.right, env);
            return __spreadArrays(lhsStmts, rhsStmts, [codeGenBinOp(expr.op)]);
        case "uniop":
            var exprStmts = codeGenValue(expr.expr, env);
            switch (expr.op) {
                case ast_1.UniOp.Neg:
                    return __spreadArrays(["(i32.const 0)"], exprStmts, ["(i32.sub)"]);
                case ast_1.UniOp.Not:
                    return __spreadArrays(["(i32.const 0)"], exprStmts, ["(i32.eq)"]);
            }
        case "builtin1":
            var argTyp = expr.a;
            var argStmts = codeGenValue(expr.arg, env);
            var callName = expr.name;
            if (expr.name === "print" && argTyp === utils_1.NUM) {
                callName = "print_num";
            }
            else if (expr.name === "print" && argTyp === utils_1.BOOL) {
                callName = "print_bool";
            }
            else if (expr.name === "print" && argTyp === utils_1.NONE) {
                callName = "print_none";
            }
            return argStmts.concat(["(call $" + callName + ")"]);
        case "builtin2":
            var leftStmts = codeGenValue(expr.left, env);
            var rightStmts = codeGenValue(expr.right, env);
            return __spreadArrays(leftStmts, rightStmts, ["(call $" + expr.name + ")"]);
        case "call":
            var valStmts = expr.arguments.map(function (arg) { return codeGenValue(arg, env); }).flat();
            valStmts.push("(call $" + expr.name + ")");
            return valStmts;
        case "alloc":
            return __spreadArrays(codeGenValue(expr.amount, env), [
                "call $alloc"
            ]);
        case "load":
            return __spreadArrays(codeGenValue(expr.start, env), [
                "call $assert_not_none"
            ], codeGenValue(expr.offset, env), [
                "call $load"
            ]);
    }
}
function codeGenValue(val, env) {
    switch (val.tag) {
        case "num":
            return ["(i32.const " + val.value + ")"];
        case "wasmint":
            return ["(i32.const " + val.value + ")"];
        case "bool":
            return ["(i32.const " + Number(val.value) + ")"];
        case "none":
            return ["(i32.const 0)"];
        case "id":
            if (env.locals.has(val.name)) {
                return ["(local.get $" + val.name + ")"];
            }
            else {
                return ["(global.get $" + val.name + ")"];
            }
    }
}
function codeGenBinOp(op) {
    switch (op) {
        case ast_1.BinOp.Plus:
            return "(i32.add)";
        case ast_1.BinOp.Minus:
            return "(i32.sub)";
        case ast_1.BinOp.Mul:
            return "(i32.mul)";
        case ast_1.BinOp.IDiv:
            return "(i32.div_s)";
        case ast_1.BinOp.Mod:
            return "(i32.rem_s)";
        case ast_1.BinOp.Eq:
            return "(i32.eq)";
        case ast_1.BinOp.Neq:
            return "(i32.ne)";
        case ast_1.BinOp.Lte:
            return "(i32.le_s)";
        case ast_1.BinOp.Gte:
            return "(i32.ge_s)";
        case ast_1.BinOp.Lt:
            return "(i32.lt_s)";
        case ast_1.BinOp.Gt:
            return "(i32.gt_s)";
        case ast_1.BinOp.Is:
            return "(i32.eq)";
        case ast_1.BinOp.And:
            return "(i32.and)";
        case ast_1.BinOp.Or:
            return "(i32.or)";
    }
}
function codeGenInit(init, env) {
    var value = codeGenValue(init.value, env);
    if (env.locals.has(init.name)) {
        return __spreadArrays(value, ["(local.set $" + init.name + ")"]);
    }
    else {
        return __spreadArrays(value, ["(global.set $" + init.name + ")"]);
    }
}
function codeGenDef(def, env) {
    var definedVars = new Set();
    def.inits.forEach(function (v) { return definedVars.add(v.name); });
    definedVars.add("$last");
    definedVars.add("$selector");
    // def.parameters.forEach(p => definedVars.delete(p.name));
    definedVars.forEach(env.locals.add, env.locals);
    def.parameters.forEach(function (p) { return env.locals.add(p.name); });
    env.labels = def.body.map(function (block) { return block.label; });
    var localDefines = makeLocals(definedVars);
    var locals = localDefines.join("\n");
    var inits = def.inits.map(function (init) { return codeGenInit(init, env); }).flat().join("\n");
    var params = def.parameters.map(function (p) { return "(param $" + p.name + " i32)"; }).join(" ");
    var bodyCommands = "(local.set $$selector (i32.const 0))\n";
    bodyCommands += "(loop $loop\n";
    var blockCommands = "(local.get $$selector)\n";
    blockCommands += "(br_table " + def.body.map(function (block) { return block.label; }).join(" ") + ")";
    def.body.forEach(function (block) {
        blockCommands = "(block " + block.label + "\n              " + blockCommands + "    \n            ) ;; end " + block.label + "\n            " + block.stmts.map(function (stmt) { return codeGenStmt(stmt, env).join('\n'); }).join('\n') + "\n            ";
    });
    bodyCommands += blockCommands;
    bodyCommands += ") ;; end $loop";
    env.locals.clear();
    return ["(func $" + def.name + " " + params + " (result i32)\n    " + locals + "\n    " + inits + "\n    " + bodyCommands + "\n    (i32.const 0)\n    (return))"];
}
function codeGenClass(cls, env) {
    var methods = __spreadArrays(cls.methods);
    methods.forEach(function (method) { return method.name = cls.name + "$" + method.name; });
    var result = methods.map(function (method) { return codeGenDef(method, env); });
    return result.flat();
}
