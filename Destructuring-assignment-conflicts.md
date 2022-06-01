## Bignums
Our features would not interact much. For example:
```Python
a : int = 0
b : int = 1
a, b = (1000000000000000, 9999999999999999)
```
In this case, we do not care what exactly is in `()`, but only perform check on whether the contents could be assigned to `a` or `b` respectively, which would be checked by `isAssignable`. This is representive because we can finish assignment in this style.

## Built-in libraries
Our features would not interact much. For example:
```Python
from math import gcd, lcm
a : int = 0
b : int = 1
a, b = gcd(12, 16), lcm(12, 16)
```
In this case, we do not care about the build-in library functions, and they are no different from a normal function call for us. This is representive because we only check the return type and expected type by using `isAssignable`. So no matter what format and implementation are for built-in libraries, we would not be influenced much.

## Closures/first class/anonymous functions
Our features would not interact much. For example:
```Python
def g(y: int) -> int:
    return y
x : Callable[[int], int] = None
y : Callable[[int], int] = None
x, y = g, g
```
We do not care what `g` represents here, but only perfrom type check with `isAssignable` to make sure `g` could be assigned to `a` and `b` both. This is representive because this test case indicates the concept that we only care about the `a` of right side expressions.

## Comprehensions
There is an overlapping part of our features:
```Python
j : int = 2
[j for a in range(1, 5) if a != 3]
```
As we can see, `a` is in fact assigned with the value returned by `range(1, 5)`, which could be done by our new assign design, and this group could perform following operations with for loop. We noticed they have nade their part work with the original definition of `assign`, and they may need to make some minor changes to this part to be compatiable with our new `destructure assign`. 

Basically, there are no additional changes needed, because the above test case could be interpretted into a simple assignment expression. We would perform necessary type check and other conversion.

## Error reporting
There is no functional dependency between our features, but we noticed that it was necessary to update all our implementation to be compatiable with their required error information. Basically, we need to change all places with `Type` to `Annotation` to include position information and error messages. And each time we throw an error, we should change our implementation to what they need with all information required.

## Fancy calling conventions
Our features would not interact much. For example:
```Python
def f(x:int, y:int = 5, z:int = 10) -> int:
    return x+y+z
x : int = 1
y : int = 1
x, y = f(1, ), f(z = 5)
```
The same reason: We do not care about the format of function calls or method calls, but only care about the return types. If return types could match our left side variables, then everything is fine. This is representive because this case shows our attitude of ignoring any internal details of function or method call implementaions.

## For loops/iterators
There is an overlapping part of our features:
```Python
cls = range(1, 4)
for i in cls:
    print(i)
```
This is similar to the case of *Comprehension*, in which `i` is assined the return type of `range(1, 4)`, and the for loop would operate the traversing procedure. We noticed they have nade their part work with the original definition of `assign`, and they may need to make some minor changes to this part to be compatiable with our new `destructure assign`. 

We also talked about a scenario like:
```Python
for a, b in (range(1, 3), range(4, 6)):
    print(a)
    print(b)
```
In this case, `a` and `b` would format a destructure assignment condition, and our current implementation would handle it correctly with a proper construction of ast node.

## Front-end user interface
Our features would might entails supports such as auto-completing, error reporting such as type-mismatch from the front-end team.
For example:
```Python
xx: int = 0
yy: bool = True
xx, yy = 1, 2
```
The variables xx and yy should have auto-completing suggestions while typing the code. The variable might be highligted with a red underline for the error of type-mismatch.

## Generics and polymorphism
Our feature do not interact with Generics and polymorphism much.
For example:
```Python
x: T = None
y: T = None
x, y = 1, 2
```
In this case, the only thing we need to care about is the type checking can work via `isAssignable`.

## I/O, files
Our feature do not interact with I/O much.
For example:
```Python
f1: File = None
f2: File = None
f1, f2 = open(...), open(...)
```
In this case, the only thing we need to care about is the type checking can work via `isAssignable`.

## Inheritance
Our feature do not interact with Inheritance much.
For example:
```Python
class ParentClass(object):
    ...

class ChildClass(ParentClass):
    ...

c1: ParentClass = None
c2: ParentClass = None
c1, c2 = ChildClass(), ChildClass()
```
In this case, the only thing we need to care about is the type checking can work via `isAssignable`.

## Lists
Our feature can have many interactions with Lists. 

First, we need an iterface to get the corresponding iterator from a list object, so that we can use the `next()` and `hasNext()` methods to do the destructuring assignment.
For example:
```Python
a1: int = 0
a2: int = 0
a3: int = 0
a4: int = 0
l: List[int] = [1, 2, 3, 4]
a1, a2, a3, a4 = l
```
To handle a desturcturing assignment like this. Our two teams shoud agree on such an interface, so that we can call, say `l.iter()` to get an iterator object.

Second, if we support assignment of elements marked with `*`, we might also need the slicing feature from lists.
For example:
```Python
a1: int = 0
a2: List[int] = None
a3: int = 0
l: List[int] = [1, 2, 3, 4]
a1, *a2, a3 = l
```
The a2 object will end up having a value l[1: -2].

## Memory management
Our feature doesn't iteract with memory management much because our implementation should not be aware of memory allocation or heap management.

## Optimization
Our feature can have supporting optimization as below.

For example:
```Python
a1: int = 0
a2: int = 0
a3: int = 0
a4: int = 0
l: List[int] = [1, 2, 3, 4]
a1, a2, a3, a4 = l
```

In this example, if the optimizer module can figure out that the variable `l` is a list that doesn't change since declaration. The optimzation can directly assign `a1`, `a2`, `a3`, `a4` with the plain constants without going through the iterator in our implementation.

## Sets and/or tuples and/or dictionaries
Our feature can have many interactions with tuples.

First, we need an iterface to get the corresponding iterator from a tuple object, so that we can use the `next()` and `hasNext()` methods to do the destructuring assignment.
For example:

```Python
a1: int = 0
a2: int = 0
a3: int = 0
a4: int = 0
t: tuple = (1, 2, 3, 4)
a1, a2, a3, a4 = t
```

To handle a desturcturing assignment like this. Our two teams shoud agree on such an interface, so that we can call, say `t.iter()` to get an iterator object.

Our feature doesn't iteract with sets and dictionaries much because we don't support destructing assignment of sets and dictionaries.

## Strings
Our feature doesn't iteract with strings much because there is no char type and we don't support destructing assignment of strings in our design.

For example:
```Python
a1: int = 0
a2: int = 0
a1, a2 = "ab"
```

In this example, the type checker will find the assignment invalid and throw an error.
