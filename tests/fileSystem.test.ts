import { BasicREPL } from "../repl";

import { Type } from "../ast";
import { importObject, addLibs } from "./import-object.test";
import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";


// localStorage.js
global.localStorage = {
    data: {},
    getItem(key) {
        // throw new Error("Call gewtItme");
        return this.data[key];
    },
    setItem(key, value) {
        // throw new Error("Call setItem");
        this.data[key] = value;
    },
    removeItem(key) {
        delete this.data[key];
    },
    length: 0,
    clear() {

    },
    key(index: number): string {
        return ""
    }
};


describe("File System testing", () => {
assertPrint("simple read write",
`
f:File = None
f = open(0, 3)
f.write(5)
f.seek(0)
print(f.read(1))
`, [`5`])
})
