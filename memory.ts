import { Template } from "webpack";

type memAddr = number;
type ref = number;


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

const refNumOffset = 0;
const sizeOffset = 1
const typeOffset =  2;
const amountOffset = 3;
const dataOffset = 4;

let refMap: Map<ref, memAddr>;
let refNum = 0; 
let memHeap: Uint32Array;


export function memInit(memory: Uint32Array) {
    refMap = new Map();
    refNum = 0;
    memHeap = memory;
}

export function memGenRef(addr: memAddr): ref {
    refNum++;
    if (refNum > 2147483647) {
        throw new MemError("maximum references allocated");
    }
    refMap.set(refNum, addr);
    return refNum;
    // TODO: add a way to recliam reference numbers.
    
}

export function refLookup(r: ref) :  ref {
    if (refMap.has(r)) {
        return refMap.get(r);
    }
    throw new MemError("invalid reference")
}

export function traverseUpdate(r: ref, update: number) {
    let explored = new Set();
    let travQueue = [r];

    while (travQueue.length > 0) {
        const curr = travQueue.shift();
        const addr = refMap.get(curr);
        const refNums = memHeap[addr + refNumOffset];

        // if refNums is set to zero then it has to be the case that it became zero in the current traversal
        // this is so because refNums with 0 references are not accessible by the Chocopy program.
        if (refNums !== 0) { 
            memHeap[addr + refNumOffset] += update
        } 

        if (curr in explored) continue;
        explored.add(curr);

        let types = memHeap[addr + typeOffset];
        let size = memHeap[addr + sizeOffset]; 
        
        for (let i = 32; i > 32 - size; i--) {
            if ((types & (1 << i)) === 1) {
                for (let a = 0; a < memHeap[addr + amountOffset]; a++) {
                    let temp = memHeap[addr + dataOffset + size*a + 32 - i];
                    if (temp !== 0) { // 0 is None
                        travQueue.push(temp);
                    }
                }
            }
        }
    }
}
