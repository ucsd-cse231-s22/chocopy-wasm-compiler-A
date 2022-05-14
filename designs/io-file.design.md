# I/O File Design
## Week 7 - Milestone Code
### Review
After the professor's review, we modify our goal to implement the functionality of open, read, write, seek, close. The resulting class is shown below.
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

Since we do not have the support of string and we use some dummy data and file to test our code. 

### Design
Since the file system is complicated, we put most of our file system code in JavaScript and provide the api for WASM code to call the function. For the File classm which represents the File class in Python, for the user to use. We create the parsed result for the function and class and import them into the parser via a function call. This can make sure that we make minimum modifiction to the major code and also 
 
### Relection on Progress

### Some testing results
Since we can not run some test results with npm test, we run it in the browser and screenshot the result. We provides the results below.


