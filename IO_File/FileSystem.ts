/**************************
 * TypeScript      Side   *
 **************************/


// What is the type for this open File
export type OpenFile = {
    currentPosition: number,
    dataArray: Array<number>
}

const buildin_file_libs = `
(func $buildin_open (import "libmemory" "open") (param i32) (param i32) (param i32))
`;

let fdCounter = 0;
let fs = new Map<number, OpenFile>();

/*
 * TODO Later: The input to open should be some value for string
 * right now pretend that we are creating a file without a fname string
 */
export function open(addr: number): number {
    fs.set(fdCounter++, {
        currentPosition: 0,
        dataArray: []
    });
    return fdCounter - 1;
}

export function read(fd: number): number {
    if (fs.has(fd)) {
        let currPos = fs.get(fd).currentPosition;
        return fs.get(fd).dataArray[currPos];
    };
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