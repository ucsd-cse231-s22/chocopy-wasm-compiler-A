### Compiler A: Bignums    
This feature will not interact with our feature. For something like read() and write(), a bignum could be bigger than the whole memory size. 

### Compiler A: Built-in libraries   
This will overlap with our feature. This group wants to implement `import` statement, so that our `File` object should live in the `io` module and ready to be imported.

```python
from io import File

f:File = None
f = open("test.txt", "w")
f.write("hello")
f.close()
```

Our builtin `open` function should also follow how they implement their builtin functions, so we will need to update how we implement it.

### Compiler A: Closures/first class/anonymous functions   
This feature will not interact with our feature, since python file API does not use first class functions.    

### Compiler A: comprehensions    
This feature will not interact with our feature. We do not use iterators. There might be a minor interaction when read() return a string, but this might be the String group's concern.   

### Compiler A: Destructuring assignment    
This feature will not interact with our feature. We do not use destructuring assignment in I/O files functions.

