# I/O File Design
## Week 7 - Milestone Code
### Design
After the professor's review, we modify our goal to implement the functionality of open, read, write, seek, close. The resulting class and function are shown below.
```
class File:
  fd: int = 0

  def __init__(self:File):
  
  def read(self: File, numByte: int) -> int:

  def write(self: File, c: int) -> int:

  def seek(self: File, pos: int):

  def close(self:File):

open(filePath: int, mode:int)
```


Since the file system is complicated, we put most of our file system code in JavaScript and provide the api for WASM code to call the function. We choose to implement most of the file system in JavaScript because it will make the implementation simpler and easier to debug. For the File class, which represents the File class in Python, for the user to use. We create the parsed result for the function and class and import them into the parser via a function call. This can make sure that we make minimum modifiction to the major code.

As we do not have the support of string, we use some dummy data and file to test our code. Namely, every single time when we open() a file, we create a dummy txt file called "test.txt" and do read() and write() to it later. The file will be actually stored in the FileSystem API in browsers. This also will make us cannot write normal unit test to show whether the test case pass or not. Instead, we will show our test cases passed by showing the context in window.localStorage in our browser in screenshots.

we design the mode in the following way:
```
enum FileMode {
    OPEN,   // Just open the file
    R_ONLY, // read only mode
    W_APPEND,  // append the data to the end
    RW,     // read and write mode
    W_CURR, // write to the current position. If wwe have data in the current position, we overwrite that piece of data  
}
```
### Some testing results
Since we can not run some test results with npm test, we run it in the browser and screenshot the result. We provides the results below.
![Alt text](./pass0.png?raw=true "Title")

![Alt text](./write_fail_mode.png?raw=true "Title")

