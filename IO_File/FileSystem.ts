/**************************
 * TypeScript      Side   *
 **************************/


// What is the type for this open File
export type OpenFile = {
    currentPosition: number,
    dataArray: Array<Byte> 
} 

const buildin_file_libs = ```
(func $buildin_open (import "libmemory" "open") (param i32) (param i32) (param i32))
```

let fdCounter = 0;
let fs = new Map<number, OpenFile>();

/*
 * The input to open should be some value for string
 */
export function open(addr: number): number {
    const dummyFile = "./test.txt";

    return -1;
}

export function read(fd: number): number {
    return -1;
}

export function write(fd: number): number {
    return -1;
}

export function close(fd: number) {

    /* can throw error if close fails*/
}

export function seek(fd: number, pos: number) {

} 


// read(file_name, mode="read string") -> string
// read(file_name, mode="read char") -> string