# I/O File Design
## Week 7 - Project Milestone Tests
### ast of the Open()

### TODOs
1. Basic methods we need to support for file objects: read(), write, close
2. I think we should discuss this further whether we should implement all of them (tell, readline, readlines, writelines, seek, truncate, next). For tell, seek, next, truncate and readline, we need to record current position of the file. For readlines and writelines, we need support from list objec

### test cases
Since we do not have the string type implemented. Thus, we need to have some dummy code to test our idea. Namely, every single time when we open() a file, we create a dummy txt file called "test.txt" and do read() and write() to it later. The file will be actually stored in the FileSystem API in browsers. This also will make us cannot write normal unit test to show whether the test case pass or not. Instead, we will show our test cases passed by showing the context in window.localStorage in our browser in screenshots.

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


#1
```
// ./test.txt is set to default as we need implementation of string
// in open() the first parameter is placeholder for later string type filePathAddress, later on it will be string type, the second parameter 3 just means the mode of open
f:File = None
f = open(0, 3)
// This will create an empty file in localStorage in browser.
```

#2
```
f:File = None
f = open(0, 1)
f.read(1)
f.close()
```

#3
```
f:File = None
f = open(0, 4)
f.write(5)
f.close()
// mode is set to 1 so though “test.txt” has been created, it is replaced by a blank one.
// file should have 5

```

#4
```
f:File = None
f = open(0, 2)
f.write(6)
f.close()
// “test” is set to default
// mode is set to 2 so it writes to the end of the file
// file should be 5 6
```

#5
```
f = open(0, 2)
f.write()
f.close()
// the mode is read only, cannot write.
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