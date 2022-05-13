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
exports.importObject = exports.addLibs = void 0;
var fs_1 = require("fs");
var Type;
(function (Type) {
    Type[Type["Num"] = 0] = "Num";
    Type[Type["Bool"] = 1] = "Bool";
    Type[Type["None"] = 2] = "None";
})(Type || (Type = {}));
function stringify(typ, arg) {
    switch (typ) {
        case Type.Num:
            return arg.toString();
        case Type.Bool:
            return arg ? "True" : "False";
        case Type.None:
            return "None";
    }
}
function print(typ, arg) {
    exports.importObject.output += stringify(typ, arg);
    exports.importObject.output += "\n";
    return arg;
}
function assert_not_none(arg) {
    if (arg === 0)
        throw new Error("RUNTIME ERROR: cannot perform operation on none");
    return arg;
}
function addLibs() {
    return __awaiter(this, void 0, void 0, function () {
        var bytes, memory, memoryModule;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    bytes = fs_1.readFileSync("build/memory.wasm");
                    memory = new WebAssembly.Memory({ initial: 10, maximum: 100 });
                    return [4 /*yield*/, WebAssembly.instantiate(bytes, { js: { mem: memory } })];
                case 1:
                    memoryModule = _a.sent();
                    exports.importObject.libmemory = memoryModule.instance.exports,
                        exports.importObject.memory_values = memory;
                    exports.importObject.js = { memory: memory };
                    return [2 /*return*/, exports.importObject];
            }
        });
    });
}
exports.addLibs = addLibs;
exports.importObject = {
    imports: {
        // we typically define print to mean logging to the console. To make testing
        // the compiler easier, we define print so it logs to a string object.
        //  We can then examine output to see what would have been printed in the
        //  console.
        assert_not_none: function (arg) { return assert_not_none(arg); },
        print: function (arg) { return print(Type.Num, arg); },
        print_num: function (arg) { return print(Type.Num, arg); },
        print_bool: function (arg) { return print(Type.Bool, arg); },
        print_none: function (arg) { return print(Type.None, arg); },
        abs: Math.abs,
        min: Math.min,
        max: Math.max,
        pow: Math.pow
    },
    output: ""
};
