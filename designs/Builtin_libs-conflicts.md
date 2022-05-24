# Compiler A: Bignums

  ```
  >>> print(2.25, 100000000000000000000000)
  2.25 100000000000000000000000
  ```

  `print()` should handle Bignums and floats. Some modification of `print()`'s input is required to load the data from the heap. Additionally, we may want to modify our mathlib functions to support Bignums. 

# Compiler A: Built-in libraries

  This is our work. 

# Compiler A: Closures/first class/anonymous functions

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

  Imported builtin functions should be handled by function reference. This might not require explicit modification of our code. 

# Compiler A: comprehensions

  We don't have much interaction with comprehensions. They don't need any implemented built-in functions, since we're not working with `range` or for loops.

  ```
  >>> from math import gcd
  >>> a:Lists = None
  >>> a = [i for i in range(10)]
  >>> print(gcd(a[6], a[9]))
  3
  ```

# Compiler A: Destructuring assignment

  We don't have much interaction with destructuring assignment, aside from the same way other function calls are used.

  ```
  >>> from math import gcd
  >>> a:int = 0
  >>> b:int = 1
  >>> a,b = 6,gcd(a,b)
  >>> print(gcd(a, b))
  0
  ```

# Compiler A: Error reporting

  ```
  >>> from math import gcd
  >>> a:int = 3
  >>> b:bool = True
  >>> gcd(a, b)
  TypeError ...
  ```

  All mathlib functions we've implemented require inputs of type `int`, so any type mismatches should cause errors. But there aren't any essential differences between user-defined functions and built-in functions here. 


# Compiler A: Fancy calling conventions

  ```
  from math import gcd
  >>> print(gcd(6, 9, 21), gcd(6, 9))
  3 3
  ```

  Fancy calling conventions support functions which accept arbitrarily-many arguments. We implement this for `print()` as a special case; it may be worth changing our `print()` handling to line up a bit more with their argument handling. We might add arbitrary length to `math.gcd` (new as of Python 3.9), and we might also use their design to give builtins default parameters. (No promises, though!)

# Compiler A: for loops/iterators

  We don't have much interaction with for loops/iterators. They don't need any implemented built-in functions (since, again, we don't deal with `range`).

  ```
  >>> from math import gcd
  >>> i:int = 1 
  >>> for i in range(6,9): 
  ... print(gcd(i, 9))
  3
  1
  1
  ```

# Compiler A: Front-end user interface

  Syntax highlighting and autocompletion can probably treat builtin functions the same way as any other functions, so that's no problem. One possible bug is with the "Clear" button: builtin functions should persist after a memory/environment reinitialization, whereas imported functions should not.

  ```
  >>> import math
  >>> # (press Clear)
  >>> print(math.factorial(3))
  ReferenceError: no module named math
  ```

# Compiler A: Generics and polymorphism

  It would be very nice if the floats we introduce are usable with generics. This will involve some modifications to the type checker, but since floats are still a 32-bit type, it should be straightforward.

  ```
  >>> T = TypeVar('T')
  >>> class Box(Generic[T]):
  ...     pass
  >>> b: Box[float] = None
  >>> b = Box()
  ```

# Compiler A: I/O, files

  There's no necessary strong interaction between file reading and builtins. We could make a builtin module `File`, but stock Python doesn't do that so it's just an option. Since we've put ourselves in charge of type-casting, we could feasibly make type coercion, but... that feels a little sinful in Chocopy.

  ```
  >>> from File import *
  >>> f:File = None
  >>> f.write_float(6.25)
  >>> f.seed(0)
  >>> print(f.read_float(1))
  6.25
  ```


# Compiler A: Inheritance

  One change we would like to make eventually, though it may not be possible, is to modify `print()` to use the `__repr__` or `__str__` methods of objects when printing them. If we do so, we should respect inheritance (i.e., use the "lowest" implementation of the function).
  ```
  >>> class Animal(object):
  ...   def __repr__(self) -> str:
  ...     return "Animal"
  ...
  >>> class Cow(Animal):
  ...   def __init__(self):
  ...     print("Moo!")
  ...
  >>> C : Cow = None
  >>> C = Cow()
  Moo!
  >>> print(C)
  Animal
  ```

# Compiler A: Lists

  We don't implement list-related built-in functions now (like `len` and `reversed`). It would be nice if we could have lists of floats. A good next goal for us is likely `min([int]), max([int])`. 

  ```
  >>> print(2, [1.25,2.5,3.5])
  2.25 [1.25,2.5,3.5]
  ```

# Compiler A: Memory management

  We have implemented floats in two ways:
- stored on the stack, like bools
- stored on the heap, like Bignums
So if the memory management approach taken supports both bignums and bools, it should support float for free. Which option the memory team uses is up to their discretion.

Otherwise, our code probably doesn't interfere much with memory management, since imported code doesn't live in WASM's memory.

```
>>> x : float = 3.14
>>> print(x)
3.14
>>> # hooray, memory management works!
```

# Compiler A: Optimization

  Floats are constants, so they can be folded. For example,
`a = (4.2+5.3)` becomes `a = 9.5`. But the optimizations which can be performed with binops are limited. Something like `a = gcd(6,9)` cannot be optimized to `a = 3`.

  As with memory management, if optimizations work for both bools and Bignums, they should work for floats.

 
# Compiler A: Sets and/or tuples and/or dictionaries

  As written, sets require integer elements. It would be very nice if they could contain floats. Neither design should need to change; floats are standard 32-bit values.

We also want to be able to print sets, but that might be partially on the string team. (More on that below...) 

  ```
  >>> s:set = set()
  >>> s = {3.5,5.25,7.5}
  >>> print(1, s)
  1 {3.5,5.25,7.5}
  ```

# Compiler A: Strings

  This is a big one. We've implemented type-casting for basic types. If we can cast things to strings and cast strings to things, it would be useful for just about everyone. The strings team's writeup is pretty clear about how strings are stored in memory (i.e., using extended ASCII, storing the length at the start address). So that just leaves the work of actually writing conversion functions in code generation.

In particular, we would love to support:
- None to str (very easy)
- bool to str (also very easy)
- int to str
- float to str
- str to bool (truthiness)
- str to int (only if valid, otherwise error)
- str to float (only if valid, otherwise error)

We're not sure whether all of these will get done by the next milestone, but some should. Several should just involve outsourcing work to JS functions.

Also, we should certainly be able to print strings. This should be easy, though, since the strings team has provided `read_str()`.

```
>>> print("CSE", str(231))
CSE 231
```

