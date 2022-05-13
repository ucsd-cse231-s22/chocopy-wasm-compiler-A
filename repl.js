"use strict";
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
exports.__esModule = true;
exports.BasicREPL = void 0;
var runner_1 = require("./runner");
var type_check_1 = require("./type-check");
var parser_1 = require("./parser");
var BasicREPL = /** @class */ (function () {
    function BasicREPL(importObject) {
        this.importObject = importObject;
        if (!importObject.js) {
            var memory = new WebAssembly.Memory({ initial: 2000, maximum: 2000 });
            var view = new Int32Array(memory.buffer);
            view[0] = 4;
            this.importObject.js = { memory: memory };
        }
        this.currentEnv = {
            globals: new Map(),
            classes: new Map(),
            locals: new Set(),
            labels: [],
            offset: 1
        };
        this.currentTypeEnv = type_check_1.defaultTypeEnv;
        this.functions = "";
    }
    BasicREPL.prototype.run = function (source) {
        return __awaiter(this, void 0, void 0, function () {
            var config, _a, result, newEnv, newTypeEnv, newFunctions, instance, currentGlobals;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        config = { importObject: this.importObject, env: this.currentEnv, typeEnv: this.currentTypeEnv, functions: this.functions };
                        return [4 /*yield*/, runner_1.run(source, config)];
                    case 1:
                        _a = _b.sent(), result = _a[0], newEnv = _a[1], newTypeEnv = _a[2], newFunctions = _a[3], instance = _a[4];
                        this.currentEnv = newEnv;
                        this.currentTypeEnv = newTypeEnv;
                        this.functions += newFunctions;
                        currentGlobals = this.importObject.env || {};
                        console.log(instance);
                        Object.keys(instance.instance.exports).forEach(function (k) {
                            console.log("Consider key ", k);
                            var maybeGlobal = instance.instance.exports[k];
                            if (maybeGlobal instanceof WebAssembly.Global) {
                                currentGlobals[k] = maybeGlobal;
                            }
                        });
                        this.importObject.env = currentGlobals;
                        return [2 /*return*/, result];
                }
            });
        });
    };
    BasicREPL.prototype.tc = function (source) {
        var config = { importObject: this.importObject, env: this.currentEnv, typeEnv: this.currentTypeEnv, functions: this.functions };
        var parsed = parser_1.parse(source);
        var _a = type_check_1.tc(this.currentTypeEnv, parsed), result = _a[0], _ = _a[1];
        return result.a;
    };
    return BasicREPL;
}());
exports.BasicREPL = BasicREPL;
