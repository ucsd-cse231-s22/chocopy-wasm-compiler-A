# I/O File Design
## Week 7 - Project Milestone Tests
### ast of the Open()
```
export type open ={filename:string, modess: openmethod[], newline?:string[]}
/* newline in python build in open means the controllers of a new line, such as “\t”, “\n”, etc
should we implement different encoding type, such as “UTF-8”. I guess webAssembly builtin function only return bytes in read and write, and does not support encoding types
*/
```
```
export type openmode = {
| {tag: “read”, start_point:int}
| {tag: “write‘, start_at_end:bool, creating:bool} 
  // if modes == “wa“, we should write at the end of the file, start_point should be true. If “x” in modes, open should fail if the file already exists
| {tag: “binary”, chunck_size:int} 
  // otherwise it is text mode, just return the string from the file
}
```
### TODOs
1. Basic methods we might need to support for file objects: 
    -  Open(int mode m) -> file: open a file in mode m.
    -  read(int i): read i bytes from file. Currently will return anything. After the implementation of string and bytes, we will add the return type.
    - write(): write "test" to the file.
    - close(): close a file.

    Thus, we will have a new data type 'File' and also the template for this File class is provided below.
    ```
    class File:
        def read(n: int) -> str

        def write(s: str)

        def close()
    ``` 
2. I think we should discuss this further whether we should implement all of them (tell, readline, readlines, writelines, seek, truncate, next). For tell, seek, next, truncate and readline, we need to record current position of the file. For readlines and writelines, we need support from list objec

### test cases
Since we cannot implement the chocopy portion until the string is implemented. Thus, we test our idea by setting the file path and mode in the runtime values to test our idea, which will be  replaced by the the position of the file as a integer variable later. We provide a test sample of write() below.
```
var memory = new WebAssembly.Memory({initial: 1, maximum: 10, shared: true});

function write(p) {
  const msg = "hello!";
  const view = new Int8Array(memory.buffer);
  for(i = 0; i < msg.length; i++) {
    view[p+i] = msg.charCodeAt(i);
  }
}

function print(p,n) {
  const view = new Int8Array(memory.buffer.slice(p,p+n));
  let msg = new String();
  for(i = 0; i < view.length; i++) {
    msg += String.fromCharCode(view[i]); 
  }
  console.log(msg);
}



(module
  (import "imports" "write" (func $write(param i32)))
  (import "imports" "print" (func $print(param i32 i32)))
  
  (func $main
      (i32.const 10)
      (call $write)
      (i32.const 10)
        (i32.const 6)
      (call $print)
  )
  (start $main)

```
Others test cases we come up with are listed below.

#1
```
// ./test.txt is set to default as we need implementation of string
// here “0” just means the mode of open
f = Open(0)
// compiler will make a call to print(mode) each time Open(mode) is called, which is used to make testcases.
```

#2
```
f = Open(0)
f.read(1)
f.close()
```

#3
```
f = Open(1)
// “test” is the default string we write to the file
// mode is set to 1 so though “test.txt” has been created, it is replaced by a blank one.
f.write()
f.close()
```

#4
```
f = Open(2)
// “test” is set to default
// mode is set to 2 so it writes to the end of the file
f.write()
f.close()
```

#5
```
f = Open(2)
// “test” is set to default
// mode is set to 2, but the file does not exist, tc will report an IO error.
f.write()
f.close()
```

#6
```
f = Open(0)
f.read() // tc will report an error as the length is not declared
f.close()
```

#7
```
f = Open(0)
f.read() // “test.txt” does not exist, tc will report an error
f.close()
```

#8
```
f = Open(0)
f.read(1)
f.write() // the mode is not correct, tc will report an error
f.close()
```

#9
```
f = Open(3) // both read and write are available.
f.read(1)
f.write()
f.close()
```

#10
```
f = Open(0) 
f.read(1) // there is not any byte in the test.txt. The tc will report an IO error.
f.close()
```
