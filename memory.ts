import { Template } from "webpack";

export type memAddr = number;
export type ref = number;


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

export const refNumOffset = 0;
export const sizeOffset = 3;
export const typeOffset =  2;
export const amountOffset = 1;
export const dataOffset = 4;

let refMap: Map<ref, memAddr>;
let refNum = 0; 
let memHeap: Int32Array;
let activeStack: Set<ref>[];


export function memInit(memory: Int32Array) {
    refMap = new Map();
    refNum = 0;
    memHeap = memory;
    activeStack = [new Set()];
}

export function memGenRef(addr: memAddr): ref {
    refNum++;
    if (refNum > 2147483647) {
        throw new MemError("maximum references allocated");
    }
    activeStack[activeStack.length - 1].add(refNum);
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

export function traverseUpdate(r: ref, update: number): ref { // returns r so that stack state can be maintained
    let explored = new Set();
    let travQueue = [r];
    if (update > 0) {
        activeStack[activeStack.length - 1].add(r);
    }

    while (travQueue.length > 0) {
        const curr = travQueue.shift();
        const addr = refMap.get(curr) / 4;
        memHeap[addr + refNumOffset] += update
        
        if (memHeap[addr + refNumOffset] < 0) { 
            memHeap[addr + refNumOffset] = 0;
        } 

        if (curr in explored) continue;
        explored.add(curr);

        let types = memHeap[addr + typeOffset];
        let size = memHeap[addr + sizeOffset]; 
        
        for (let i = 0; i < size; i++) {
            if ((types & (1 << i)) !== 0) {
                for (let a = 0; a < memHeap[addr + amountOffset]; a++) {
                    let temp = memHeap[addr + dataOffset + size*a + i];
                    if (temp !== 0) { // 0 is None
                        travQueue.push(temp);
                    }
                }
            }
        }
    }
    return r
}

export function addScope() {
    activeStack.push(new Set());
}

export function removeScope() {
    activeStack[activeStack.length - 1].forEach(r => traverseUpdate(r, -1));
    activeStack.pop();
}

export function debugId(id: number, offset: number) { // id should be of type int and the first field in the object
    for (const [_, addr] of refMap) {
        if (memHeap[addr/4 + dataOffset] === id) {
            return memHeap[addr/4 + offset];
        }
    }
    throw new Error(`no such id: ${id}`);
}


