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
export const METADATA_AMT : number = 4;

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
    throw new MemError(`invalid reference: ${r}`)
}

export function traverseUpdate(r: ref, assignRef: ref, update: number): ref { // returns r so that stack state can be maintained
    //console.log(`ref trav ${r}, update: ${update}`);
    if (r === 0) {
        return r
    }
    let explored = new Set();
    explored.add(assignRef);
    let travQueue = [r];
    if (update > 0) {
        activeStack[activeStack.length - 1].add(r);
    }

    while (travQueue.length > 0) {
        const curr = travQueue.shift();
        const addr = refLookup(curr) / 4;
        console.log("addr: " + addr);
        console.log("before: " + memHeap[addr + refNumOffset]);
        memHeap[addr + refNumOffset] += update;
        console.log("after:" + memHeap[addr + refNumOffset]);
        if (memHeap[addr + refNumOffset] < 0) { 
            memHeap[addr + refNumOffset] = 0;
        } 
        explored.add(curr);

        let types = memHeap[addr + typeOffset];
        let size = memHeap[addr + sizeOffset]; 
        const amt = memHeap[addr + amountOffset];
        //console.log(types);
        for (let i = 0; i < size; i++) {
            if ((types & (1 << i)) !== 0) {
                for (let a = 0; a < (amt - METADATA_AMT) / size; a++) {
                    let temp = memHeap[addr + dataOffset + size*a + i];
                    if (temp !== 0 && !explored.has(temp)) { // 0 is None
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
    console.log("in function");
}

export function removeScope() {
    console.log("outside function, deleting refs");
    activeStack[activeStack.length - 1].forEach(r => traverseUpdate(r, -1, -1));
    activeStack.pop();
    console.log("outside function, deleted refs");
    
}

export function debugId(id: number, offset: number) { // id should be of type int and the first field in the object
    for (const [_, addr] of refMap) {
        if (memHeap[addr/4 + dataOffset] === id) {
            return memHeap[addr/4 + offset];
        }
    }
    throw new Error(`no such id: ${id}`);
}


