/**************************
 * TypeScript      Side   *
 **************************/


// What is the type for this open File
export type OpenFile = {
    filePath: string,
    currentPosition: number,   // the position of the current pointer
    dataArray: Array<number>,  // the data store in this file
    mode: FileMode,            // the mode of this file  
    dirty: boolean,           // a boolean value to indicate that if this files has been written
}

enum FileMode {
    OPEN,   // Just open the file
    R_ONLY, // read only mode
    W_END,  // write to the end
    RW,     // read and write mode

}

const buildin_file_libs = `
(func $buildin_open (import "libmemory" "open") (param i32) (param i32) (result i32))
(func $buildin_read (import "libmemory" "read") (param i32) (result i32))
(func $buildin_write (import "libmemory" "write") (param i32) (param i32) (result i32))
(func $buildin_close (import "libmemory" "close") (param i32) (result i32))
(func $buildin_seek (import "libmemory" "seek") (param i32) (param i32) (result i32))

`;

let fdCounter = 0;
let fs = new Map<number, OpenFile>();

/*
 * TODO Later: The input to open should be some value for string
 * right now pretend that we are creating a file without a fname string
 * 
 * ct: for the mode, we might need to create a 'mode translator' to translate from Python mode to our mode
 */
export function open(filePathAddr: number, mode: number): number {
    
    fs.set(fdCounter++, {
        filePath: 'test.txt', // a dummy address. If we have string we should read the address
        currentPosition: 0,
        dataArray: [],
        mode: mode,
        dirty: false,
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

export function write(fd: number, c: number): number {
    
    const f = checkFileExistence(fd);

    // check mode
    if(f.mode === FileMode.OPEN || f.mode === FileMode.R_ONLY) {
        throw new Error(`RUNTIME ERROR: file with fd = ${fd} is not writable (mode = ${f.mode})`);
    }

    f.dataArray.push(c);
    f.dirty = true;

    return - 1; // currently it should return - 1
}

/**
 * What should we do when we close the file?
 * If it is dirty than, we should write the file to filePath
 * @param fd 
 */
export function close(fd: number): number {

    const f = checkFileExistence(fd);

    // TODO: this file has been modified -> write data to the file
    if(f.dirty) {
        writeFile(f);
    }
    
    // remove this file from file descriptor
    fs.delete(fd);

    return 0;
}

export function seek(fd: number, pos: number) {
    const f = checkFileExistence(fd);
    f.currentPosition = pos;
}

/**
 * Helper functions (private functions)
 */
function checkFileExistence(fd: number): OpenFile {
    if(! fs.has(fd)) {
        throw new Error(`RUNTIME ERROR: file with id = ${fd} does not exists`);
    }
    return fs.get(fd);
}

/**
 * This function should write the dataArry to the file with filePath
 * @param f the OpenFile to write
 * @return true if write successfully
 */
function writeFile(f: OpenFile): boolean {
    return false;
}

// read(file_name, mode="read string") -> string
// read(file_name, mode="read char") -> string