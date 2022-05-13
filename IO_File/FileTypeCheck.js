"use strict";
exports.__esModule = true;
exports.addFileBuildinFuns = void 0;
function addFileBuildinFuns(funs) {
    funs.set("buildin_open ", [[{ tag: "number" }, { tag: "number" }], { tag: "number" }]);
    funs.set("buildin_read ", [[{ tag: "number" }, { tag: "number" }], { tag: "number" }]);
    funs.set("buildin_write ", [[{ tag: "number" }, { tag: "number" }], { tag: "number" }]);
    funs.set("buildin_close ", [[{ tag: "number" }], { tag: "none" }]);
    funs.set("buildin_seek ", [[{ tag: "number" }, { tag: "number" }], { tag: "none" }]);
    return funs;
}
exports.addFileBuildinFuns = addFileBuildinFuns;
