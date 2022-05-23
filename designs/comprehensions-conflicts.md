# Possible Conflicts with Comprehensions

* Compiler A: Bignums

They have modified how bignums are created, calculated and stored in the memory, along with binary and unary operations of bignums. This should not overlap with our list comprehension implementation. Example program of no interaction:
```
i:int=0
print(BigInt("100000000000000000000000"))
print([i for i in Range.new(0,2)])
```
Even if bignums are used inside comprehensions, they should be handled automatically by their implementation. Example program:
```
c:int=BigInt("100000000000000000000000")
i:int=0
print([c for i in Range.new(0,2)])
```

* Compiler A: Built-in libraries

This team has implemented built-in libraries such as gcd, lcm, float, factorial and handling of import statements. This should not have any conflicts with our comprehensions implementation. Even is these libraries are used, they should be correctly handled by their implementation. Example program:
```
i:int=0
print([factorial(i) for i in range(1,3)])
```

* Compiler A: Closures/first class/anonymous functions

This team has implemented closures, nested functions and functions like lambda functions. These should have no conflicts with the comprehensions implementation. They should be automatically handled by their implementation itself. Example program:
```
def f(x:int)->int:
    def g(y:int)->int:
        return y
    return x+g(4)
i:int=0
print([f(2) for i in Range.new(0,2)])
```

* Compiler A: Destructuring assignment

This team has handled destructuring assignment nicely. Once we have actually implemented storing comprehensions as lists, then we can so below tests that should work properly based on their implementation:
```
i:int=0
a:bool=True
b:Range=None
a,b=False,[i for i in Range.new(0,2)]
```

* Compiler A: Error reporting

This team has handled error reporting by adding Annotations and Location information in the ast.ts file itself. This will cause a **lot of merge conflicts** due to syntax changes in various files. We plan to correct these in the upcoming week. But other than that, no other conflicts should occur with respect to the code compiling and implementation.

* Compiler A: Fancy calling conventions

The fancy calling implementations should not have any conflicts with comprehensions. Example program:
```
def f(x:int,y:int=5)->int:
    return x+y
i:int=0
print([f(i) for i in Range.new(0,2)])
```

* Compiler A: Front-end user interface

Our work is independent of this team's work. Once we store our comprehensions in lists using some code from the lists team, the comprehension result would become a list and the front-end would handle this like normal lists. Thus, no conflicts here.

* Compiler A: Generics and polymorphism

???

* Compiler A: I/O, files

Looking at their PR so far, it does not look like their is much overlap with our implementation here. File read and writes in comprehensions would be handled by their implementation. Example program:
```
i:int=0
f:File=None
f.open(0,3)
f.write(5)
f.seek(0)
print([f.read(1) for i in Range.new(0,2)])
f.close()
```

* Compiler A: Inheritance

There should not be any conflicts with their implementation. If there is an object lookup from a subclass in a comprehension, fetching the correct value would be handled by their inheritance implementation. Example program:
```
class A(object):
    x:int=1
class B(A):
    y:int=2
class C(B):
    z:int=3
c:C=None
c=C()
i:int=0
print([c.x for i in Range.new(0,2)])
```

