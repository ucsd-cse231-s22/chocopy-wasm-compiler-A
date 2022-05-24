# Compiler A: Strings
## Conflicts

1. Bignums

    The interaction with Bignums should happen in the lower.ts. When encountering a big number, we should use BigInt() to handle it. The Bignums implementation is similar to strings, they store the digits number on top of memory and then its digit values. If the length of a string is a big number, we could just store the address of the big number on top of our string memory.

    

2. Built-in libraries

    ```Python
    def f(s:str) -> str:
        return s

    s1:str = "abcd"
    s2:str = "abcde"
    print(f(s1), f(s2))
    ```

    Expected output:
    ```Python
    abcd abcde
    ```

    The extended print() should work for strings. It should be easy to implement by calling our print_str function in wasm code. Besides, we would like to have a general len() function to get the length of strings, lists, or sets. We have noticed that list is also stroed with its length on top of its memory. The general len() function could take in the address of strings, lists, or sets and return the value on top of this address.


3. Closures/first class/anonymous functions

    ```Python
    def outer(name):
      def inner():
        print(name)
      inner()
    # call the enclosing function
    outer('abc')
    ```

    Expected output:
    ```Python
    abc
    ```

    We think this feature does not interact much with ours, because this feature is on the level of functions and does not require using strings.

    This is the basic example of closure. This example includes closures and calls print(string) function. From the view of this print, it just receives a string type value as an input and prints it out.

4. Comprehensions

    ```Python
    s: str = "abc"
    print([i for i in s])
    ```

    Expected output:
    ```Python
    ['a', 'b', 'c']
    ```

    This feature will interact with our feature, because the value of comprehension should be iterable and string is iterable. When iterating a string, we can get the length from ast, which has been implemented by us. Then, every time to print a character, it can call out print_str method to print it on the screen.

    We don't need to change anything because, essentially, it is to print every element when iterating a string.



5. Destructuring assignment

    ```Python
    def f() -> int:
      a = "abcde"
      v1, v2, v3, v4, v5 = a
      return v1 + v2 + v3 + v4 + v5
    f()
    ```

   Expected output:
    ```Python
    abcde
    ```

   This feature may interact with ours, because the right-hand side of destructuring assignment should be an iterable value and string is iterable.

    The length of the string should be equal to the number of variables to be destructured. Otherwise, it will throw an error. To implement this, their group can get the length from the parser, because we have saved the length as an attribute. Then, the process is similar to create several strings, which has been implemented by us.

6. Error reporting

    ```Python
    print("a"+1)
    ```

   Expected output:
    ```Python
    Error: TYPE ERROR: Binary operator `+` expects type "number" on both sides, got "str" and "number" on line 1 at col 7 print("a"+1)
    ```

   This case shows the error message when we are processing a string.

    This feature may interact with ours, because there are many errors we will throw during parsing and compiling. But we don't need to feel confused about it because we can directly use the way of throwing errors implemented by this group.

7. Fancy calling conventions

    ```Python
    def f(x:str = "abc"):
      print(x)
    
    
    s: str = "def"
    f(s)
    ```

   Expected output:
    ```Python
    def
    ```

   There is no interaction with our feature, because this is on the level of a function and has no relationship with string. In this case, string only acts as a common variable.


8. for loops/iterators

    ```Python
    def f(s:str) -> str:
        i:str = "a"
        for i in s:
            print(i)
        return s

    s:str = "abcd"
    print(f(s))
    ```

    Expected output:
    ```Python
    a
    b
    c
    d
    abcd
    ```

    For now, strings cannot interact with for-loop correctly. The key of Range() class is that it is an iterable object. We could make strings iterable when encountering the for-loop.


9. Front-end user interface

    ```Python
    def f(s:str) -> str:
        return s

    s:str = "abcd"
    print(f(s))
    f(s)
    ```

    Expected output:
    ```Python
    abcd
    "abcd" (or 'abcd')
    ```

    A minor difference between print strings and just "call" strings. For now, calling f(s) will return the address of the string. We could modify this to return the values of string and dispaly the them with quotes in REPL.


10. Generics and polymorphism

    ```Python
    T = TypeVar('T')
    class Box(Generic[T]):
      pass
    b: Box[str] = None
    b = Box()
    ```

    There might be no interaction with our feature. String just plays a role of a primitive type and can be used in generics. But we don't need to change anything.
    


11. I/O, files

    ```Python
    File.read("D://workspace")
    ```

    The interaction occurs when we use string as the address of the input. We have made some constraints on the format of strings. Therefore, to correctly input the address, the address should use escape characters. Such as using "\\" instead of "\". But in implementation, there might be nothing we have to pay attention to.

    Apart from that, after reading a file, we will need to save the file in the form of a string. For the input that contains backslashes, we may need to take action to deal with them, because the original file won't automatically convert a character to an escape character.


12. Inheritance

    There is no interaction with our feature, because it is on the level of function. We don't need to change anything related to string.


13. Lists

     ```Python
    def f(s1:str, s2:str) -> [str]:
        str_list: [str] = None
        str_list = [s1, s2]
        return str_list

    s1:str = "abcd"
    s2:str = "abc"
    s:str = "a"
    for s in f(s1, s2):
        print(s)
    ```

    Expected output:
    ```Python
    abcd
    abc
    ```

    It should work because we store the addresses of s1 and s2 in s1 and s2. It should have no difference between stroing strings and storing integers in lists.


14. Memory management

     ```Python
    def f(s) -> str:
        return s

    s:str = "abcd"
    s1:str = f(s)
    s2;str = f(s)
    ```

    Expected output:
    Let `o` be the object referred to by variable `s`
    ```
    assert number of references of o is 3
    assert size of o(in bytes) is 4
    assert type of the fields in o is [value]
    ```

    Since strings come with memory allocation and values storage, we could put the same address to s, s1, and s2. The memory management structure could be simpler by getting rid of type information and size of a single object. We could know the class type in varInit, while for string, we need to go into memory and find out its values. It will be different when managing the memory of strings.


15. Optimization

    It may not have a python program example here. But we could optimize our wasm code by applying constant folding and constant propagations.


16. Sets and/or tuples and/or dictionaries
    
     ```Python
    def f(s1:str, s2:str) -> set:
        str_set: set = set()
        str_set.add(s1)
        str_set.add(s2)
        return str_list

    s1:str = "abcd"
    s2:str = "abc"
    s3:str = "ab"
    print(f(s1, s2).has(s1))
    print(s2 in f(s1, s2))
    print(f(s1, s2).has(s3))
    ```

    Expected output:
    ```Python
    True
    True
    False
    ```

    When sets, tuples, and dictionaries contain strings, they store the addresses of strings just like stroing integers. There will be no difference in lists and sets/tuples/dictionaries.
