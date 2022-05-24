- Compiler A: Bignums

  ```
  >>> print(2.25, 100000000000000000000000)
  2.25 100000000000000000000000
  ```

  The print() should handle Bignums type and float type. Some modification of print()'s input is required to load the data from the heap. As the [Bignums](https://github.com/ucsd-cse231-s22/chocopy-wasm-compiler-A/blob/8a3cbb76f11e7970e6c7fc77483079e49adc01e6/designs/Bignums-design.md ) doesn't support the arithmetic operations like +-*/, Math lib would not be supported. 

- Compiler A: Built-in libraries

  This is our work. 

- Compiler A: Closures/first class/anonymous functions

  ```
  >>> from math import gcd
  >>> def gcd_add_1(a: int, b: int) -> int:
  ...     return gcd(a,9)+1
  >>> gcd_add_1_ref: Callable[[int, int], int] = gcd_add_1
  >>> print(gcd_add_1_ref(6))
  3
  >>> print(gcd(6, 9))
  3
  ```

  The imported builtin functions should be handled by function reference. Maybe we don't need explicit modify our codes. 

- Compiler A: comprehensions

  We don't have much interactions with comprehensions. They don't need any implemented built-in functions.

  ```
  >>> from math import gcd
  >>> a:Lists = None
  >>> a = [i for i in range(10)]
  >>> print(gcd(a[6], a[9]))
  3
  ```

- Compiler A: Destructuring assignment

  We don't have much interactions with destructuring assignment. They don't need any implemented built-in functions.

  ```
  >>> from math import gcd
  >>> a:int = 0
  >>> b:int = 1
  >>> a,b = 6,9
  >>> print(gcd(a, b))
  3
  ```

- Compiler A: Error reporting

  Now all math functions requires int input. The mismatch type error would be raised by error reporting. But there aren't any essential differences between the inputs' type checking of user-defined functions and built-in functions. 

  ```
  >>> from math import gcd
  >>> a:int = 3
  >>> b:bool = True
  >>> gcd(a, b)
  ```

- Compiler A: Fancy calling conventions

  ```
  from math import gcd
  >>> print(gcd(6, 9, 21), gcd(6, 9))
  3 3
  ```

  The fancy calling convention supports the parsing of the arguments with arbitrary length arguments and accept default value setting. But we have individually implemented the arbitrary length arguments of some built-in function. We may add the support of arbitrary length arguments of gcd, which is introduced in python39. We might refer their design to add the default value for some builtin functions, but there is no no promises. 

- Compiler A: for loops/iterators

  We don't have much interactions with for loops/iterators. They don't need any implemented built-in functions.

  ```
  >>> from math import gcd
  >>> i:int = 1 
  >>> for i in range(6,9): 
  ... print(gcd(i, 9))
  3
  1
  1
  ```

- Compiler A: Front-end user interface

  We don't have much interactions with for loops/iterators. They don't need any implemented built-in functions and they don't care if a function is user-defined or built-in. One possible bug here is that when they cleaning the environment, the built-in libraries are forgot to removed. 

- Compiler A: Generics and polymorphism

  As the new type float is introduced, some modifications of the type-checker are required. 

  ```
  >>> T = TypeVar('T')
  >>> class Box(Generic[T]):
  ...     pass
  >>> b: Box[float] = None
  b = Box()
  ```

- Compiler A: I/O, files

  Maybe the File related-works should be managed by our import.  The float variables should also be able to be dumped. There would not be much works, as they write the file as byte stream, maybe only some additional instructions like `i32.reinterpret` are needed. 

  ```
  >>> from File import *
  >>> f:File = None
  >>> f.write_float(6.25)
  >>> f.seed(0)
  >>> print(f.read_float(1))
  6.25
  ```

  

- Compiler A: Inheritance

  We don't have much interactions with Inheritance. There is no class things implemented here. 

- Compiler A: Lists

  We don't implement much list-related built-in functions now. Maybe the list could support the float type as the float is Literal. Maybe we can implement `min([int]), max([int])` next. 

  ```
  >>> print(2, [1.25,2.5,3.5])
  2.25 [1.25,2.5,3.5]
  ```

- Compiler A: Memory management

  We have implemented float in two approaches, one is storing the float on stack like the bool, the other is storing the float on heap like bignums. So if the memory management can support both the bignums and bool, it should support float. 

- Compiler A: Optimization

  The constant folding transformation could be also valid for float. For example,  `
a = (4.2+5.3)
  ` is transformed to `
  a = 9.5
  `.  But such transformation are limited with binops. Something like `
a = gcd(6,9)
  ` cannot be optimized to `
a = 3
  ` Similar to memory management, if they support both the bignums and bool, it should support float. 
  
- Compiler A: Sets and/or tuples and/or dictionaries

  The set treats the input as int. It would be annoying to support something like `
  a:set = {3.5,1,True,None}
  `. But if necessary, we could support API to reinterpret floats as int32, and sets store elements as int 32 along with the element's types in another ordered set (although sounds wired). 

  ```
  >>> s:set = set()
  >>> s = {3.5,5.25,7.5}
  >>> print(1, s)
  1 {3.5,5.25,7.5}
  ```

- Compiler A: Strings

We should be able to print strings. It should be easy to extend as they have already provide read_str(). 

```
>>> print("CSE", 231)
CSE 231
```

