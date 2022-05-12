type memAddr = Number;
type ref = Number;


// Below can be implemented as a class and has some additonal
// https://github.com/WebAssembly/interface-types/issues/18


// Below is a similar approach but does not require mapping to objects
// if this looks a bit hacky, take a look at the issue above

class MemError extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = "MemoryError"
    }
}


let refMap: Map<ref, memAddr>;
let refNum = 0;

export function memInit() {
    refMap = new Map();
    refNum = 0;
}

export function memGenRef(arg: memAddr) {
    refMap.set(arg, refNum);
    refNum++;
    // TODO: add a way to recliam reference numbers.
    if (refNum > 2147483647) {
        throw new MemError("maximum references allocated");
    }
}

export function refLookup(arg: ref) :  ref {
    if (refMap.has(arg)) {
        return refMap.get(arg);
    }

    throw new MemError("invalid reference")
}
