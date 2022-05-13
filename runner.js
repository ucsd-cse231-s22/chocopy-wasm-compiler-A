"use strict";
// This is a mashup of tutorials from:
//
// - https://github.com/AssemblyScript/wabt.js/
// - https://developer.mozilla.org/en-US/docs/WebAssembly/Using_the_JavaScript_API
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.run = exports.augmentEnv = exports.runWat = void 0;
var wabt_1 = require("wabt");
var compiler_1 = require("./compiler");
var parser_1 = require("./parser");
var type_check_1 = require("./type-check");
var utils_1 = require("./utils");
var lower_1 = require("./lower");
// NOTE(joe): This is a hack to get the CLI Repl to run. WABT registers a global
// uncaught exn handler, and this is not allowed when running the REPL
// (https://nodejs.org/api/repl.html#repl_global_uncaught_exceptions). No reason
// is given for this in the docs page, and I haven't spent time on the domain
// module to figure out what's going on here. It doesn't seem critical for WABT
// to have this support, so we patch it away.
if (typeof process !== "undefined") {
    var oldProcessOn_1 = process.on;
    process.on = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (args[0] === "uncaughtException") {
            return;
        }
        else {
            return oldProcessOn_1.apply(process, args);
        }
    };
}
function runWat(source, importObject) {
    return __awaiter(this, void 0, void 0, function () {
        var wabtInterface, myModule, asBinary, wasmModule, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, wabt_1["default"]()];
                case 1:
                    wabtInterface = _a.sent();
                    myModule = wabtInterface.parseWat("test.wat", source);
                    asBinary = myModule.toBinary({});
                    return [4 /*yield*/, WebAssembly.instantiate(asBinary.buffer, importObject)];
                case 2:
                    wasmModule = _a.sent();
                    result = wasmModule.instance.exports.exported_func();
                    return [2 /*return*/, [result, wasmModule]];
            }
        });
    });
}
exports.runWat = runWat;
function augmentEnv(env, prog) {
    var newGlobals = new Map(env.globals);
    var newClasses = new Map(env.classes);
    var newOffset = env.offset;
    prog.inits.forEach(function (v) {
        newGlobals.set(v.name, true);
    });
    prog.classes.forEach(function (cls) {
        var classFields = new Map();
        cls.fields.forEach(function (field, i) { return classFields.set(field.name, [i, field.value]); });
        newClasses.set(cls.name, classFields);
    });
    return {
        globals: newGlobals,
        classes: newClasses,
        locals: env.locals,
        labels: env.labels,
        offset: newOffset
    };
}
exports.augmentEnv = augmentEnv;
// export async function run(source : string, config: Config) : Promise<[Value, compiler.GlobalEnv, GlobalTypeEnv, string]> {
function run(source, config) {
    return __awaiter(this, void 0, void 0, function () {
        var parsed, _a, tprogram, tenv, globalEnv, irprogram, progTyp, returnType, returnExpr, globalsBefore, compiled, globalImports, globalDecls, importObject, memory, wasmSource, _b, result, instance;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    parsed = parser_1.parse(source);
                    _a = type_check_1.tc(config.typeEnv, parsed), tprogram = _a[0], tenv = _a[1];
                    globalEnv = augmentEnv(config.env, tprogram);
                    irprogram = lower_1.lowerProgram(tprogram, globalEnv);
                    progTyp = tprogram.a;
                    returnType = "";
                    returnExpr = "";
                    // const lastExpr = parsed.stmts[parsed.stmts.length - 1]
                    // const lastExprTyp = lastExpr.a;
                    // console.log("LASTEXPR", lastExpr);
                    if (progTyp !== utils_1.NONE) {
                        returnType = "(result i32)";
                        returnExpr = "(local.get $$last)";
                    }
                    globalsBefore = config.env.globals;
                    compiled = compiler_1.compile(irprogram, globalEnv);
                    globalImports = __spreadArrays(globalsBefore.keys()).map(function (name) {
                        return "(import \"env\" \"" + name + "\" (global $" + name + " (mut i32)))";
                    }).join("\n");
                    globalDecls = compiled.globals.map(function (name) {
                        return "(global $" + name + " (export \"" + name + "\") (mut i32) (i32.const 0))";
                    }).join("\n");
                    importObject = config.importObject;
                    if (!importObject.js) {
                        memory = new WebAssembly.Memory({ initial: 2000, maximum: 2000 });
                        importObject.js = { memory: memory };
                    }
                    wasmSource = "(module\n    (import \"js\" \"memory\" (memory 1))\n    (func $assert_not_none (import \"imports\" \"assert_not_none\") (param i32) (result i32))\n    (func $print_num (import \"imports\" \"print_num\") (param i32) (result i32))\n    (func $print_bool (import \"imports\" \"print_bool\") (param i32) (result i32))\n    (func $print_none (import \"imports\" \"print_none\") (param i32) (result i32))\n    (func $abs (import \"imports\" \"abs\") (param i32) (result i32))\n    (func $min (import \"imports\" \"min\") (param i32) (param i32) (result i32))\n    (func $max (import \"imports\" \"max\") (param i32) (param i32) (result i32))\n    (func $pow (import \"imports\" \"pow\") (param i32) (param i32) (result i32))\n    (func $alloc (import \"libmemory\" \"alloc\") (param i32) (result i32))\n    (func $load (import \"libmemory\" \"load\") (param i32) (param i32) (result i32))\n    (func $store (import \"libmemory\" \"store\") (param i32) (param i32) (param i32))\n    " + globalImports + "\n    " + globalDecls + "\n    " + config.functions + "\n    " + compiled.functions + "\n    (func (export \"exported_func\") " + returnType + "\n      " + compiled.mainSource + "\n      " + returnExpr + "\n    )\n  )";
                    console.log(wasmSource);
                    return [4 /*yield*/, runWat(wasmSource, importObject)];
                case 1:
                    _b = _c.sent(), result = _b[0], instance = _b[1];
                    return [2 /*return*/, [utils_1.PyValue(progTyp, result), compiled.newEnv, tenv, compiled.functions, instance]];
            }
        });
    });
}
exports.run = run;
