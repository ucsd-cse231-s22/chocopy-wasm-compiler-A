# Bignums

For now, there has no interaction between bignums and set implementation, might have some in the future. Now our set implementation give all elements as number. And call a wasm set function in the compiler. But if all nums are stored as bignum, it will change (i32.const num) to a address of several digits and the set function might not work.
```
a:set() = {1,2,3}
```
The simplest program will store all num as bignum and cause some conflict even in initialization. In initialization step, the set$add function is called every time to add elements one by one and it might cause the conflict.

# Built-in libraries

No much interaction.

The built-in libraries are mainly working on syntax of `from lib import func`. Then they add some new mathematical functions such as `gcd()` and `lcm()`. These are similar as the `abs()` function and will not influence the set implementation. There function might produce some value that could be used in the set function:

```
From math import lcm
a:set() = {1,2,3}
a.add(lcm(2,4))
```

The program will add the result of `lcm(2,4)` to the set.

# Closures

No much interaction.

There group are working on having more inner class or innor functions. Set is more like a type of value or literal which can be defined in different ranges. The relationship between us and their group is similar to set to class.

```
def f() -> int:
    a:set() = {1,2,3}
    def g() -> int:
        nonlocal a
        print(2 in a)
        return 0
    g()
f()
```

The program above should print True as the keyword nonlocal will lead to a variable which is not local and give the True result as 2 is in the set.

# Comprehensions

No much interaction.

The comprehensions are used in list representation currently. But in the future, they might have set comprehension such as:

```
a:set() = {}
a = {a for a in [1,2,1,0]}
```
Should give the result of `set([0,1,2])`. It is quite interesting that making set functions much simpler.

# Destructureing assignment
No interaction
For now because set does not support a iterator, no idea how can set be used in destructering assignment. Expect for using set like a num in assignment.
```
c:set() = {1,2,3}
a, b = 2, c
print(a in b)
```
Should give output as True because a is assigned as 2 and c is assigned as {1,2,3}.

# Compiler A: Error reporting
Some conflicts with the annotation type.
Example Case:
```
s:set = ()
S = True
```
Expected Error:
TypeError: assignment value should have assignable type to type `set`, got `bool` on line ... at col ...
This added `Annotation` type for source reporting. Since our type-checked currently adopts `Type` type for 'a?' annotation. Some changes are needed in our annotation representation for this error reporting to work correctly.


# Fancy Calling Convention:

Not much Interaction.

The pull request of that group is about implementing default/non-default parameters, reading, parsing, and returning function parameters of all types. Since the function parameter is now designed to handle expressions as values. The introduction of the set as a default parameter can be handled in a similar way as “x: int = {1,2}”(in the main body). Consider the following statement:

```
def f(x:int={1,2}):
    print (x)
    return

f()
```

The program will output {1,2}. The Fancy Calling Convention will traverseExpr the parameter x and call functions to handle set expressions thereafter. This behavior acts quite similar to calling “s:set={1,2,3}” in the main body of a python script, so there’s no additional work needed to cover interactions.

# For-loop/Iterators

Heavily Overlapped

This feature heavily overlaps with our implementation of the set. In fact, the iterator overlaps with literally all other data structures. Consider the following example:

```
for x in ({1,2,3}):
    print(x)

```
This test code gives a scenario where the program needs to iterate through all elements of a set. Currently, we have helper functions to traverse all elements of the set. The group of for/iterators also writes methods such as "next", "hasnext" for Range. The next step is to combine these two parts of code, to create a set iterator when “for … in set” is called.

A key difference between set iterator and range iterator is the method of fetching the “next” element.  When searching for the next element, range iterators can directly increment its value, while set iterators may jump to the next available address or navigate through a linked list. To make the for-loop work as expected, both traversing strategies must be implemented.

# Frontend 

Some overlapping

The pull request of the frontend group mainly focuses on the print and representation of the class.  Our group also needs to deal with the representation of the set. Nevertheless, the representation of the set should be built upon the iterator. The reuse strategy ensures the workload of the Frontend team is within a reasonable range. Think about the following code example.

```
  input:
    S:set = {1,2,3}
  // in REPL:
    >>> S
```
The output generated by the console should be based on “print(s)”. It may contain some additional information like the set address, but it should display every element inside. Therefore, the mission of our two groups is to re-use the iterator to print out every element, and also settle the format of additional information, to make the call of S in REPL be like:
```
address:100
{1,2,3}
```


# Generics

No interaction

The generics group is working on applying the rules of generic to class. However, the set does not share the same problem with them. The design of the set only allows 1~2 types of data as elements. As a result, the generic has few chances to be applied here. The only generic rule (if any) is that the types of the element must be in the “supported data types list”.
```
A : set[int] = {1,2,3} #Allowed, as int element is supported.
Class c():
……
Class d():
……

B : set[class] = {c,d}#Not allowed, class is not a hashable data type
# fulfilled by keeping a white list of element data types.
```
As you can see, the set should reject the unhashable data, which eliminates the necessity of building generics for the set. The white list of hashable data is already built in the type-check program and it plays the role of generic check rules: when a set is given its first element. It will set the type of element it (only) contains:
```
a : set= {1,2,3} # a : set[int] #implemented
b : set= {'a','b','c'} # a : set[char] # not yet
a.add('a') # Typecheck error
b.add(1) # Typecheck error
```


# I/O, Files

No interaction

The I/O group’s pull request is about writing and reading to/from files. The behavior is heavily involved with strings. Set, on the other hand, has limited scenarios that might get involved in the I/O statements. The only scenario between file and set is when I/O trying to write a file with elements from a set:
```
s : set = {1,2,3}
f  :  File = open(“abc.txt”)
for each in s:
	f.write(each)
```
This part of the code must use the iterator design we described earlier. However, it does not require anything more than that. The iterator gives an element each time when called, the file writer type-checks it, and outputs it to the file. The interaction (if any) between the set and I/O is built in an indirect way.


# Inheritance

No interaction

Object inheritance has nothing to do with the set. When sets are built, all of them share the same method, and reloading them should be strictly prohibited. Sets also have their own “update” function, which behaves similarly to inheritance:
```
a:set = {1,2,3}
b:set = set()
b.update(a) # b “inherits” all elements from a
print(b) #{1,2,3}
```
Therefore, the inheritance of sets is already fulfilled by the Set.update method. There is no interaction between inheritance and set.


# Compiler A: Lists
No interaction at this milestone. Will have some interactions if we consider supporting "set of list" in the future.
Example Case:
```
s:set = set()
s.add([1,2,3],[4,5,6])
print(len(s))
```
Expected Output: 2
This pr stores a list as with a pointer to a memory chunk in heap. We'll have to store the address of the list memory block in our hash table to construct the set and fetch the list elements.

# Compiler A: Memory management
Not much conflict.
Example Case:
```
x:set = set()
x = {1,2,3}
print(1 in s)
```
Expected Output: True
This pr is a general memory design and should work for all the data stored on the memory in a similar behavior. In our implementation, set elements are stored using 10 linked lists. Each node of the lined list consists of 4 bytes value and 4 bytes address pointing to the next node. If this pr works correctly, our set should be managed well by the memory module.

# Compiler A: Optimization
No conflicts.
Example Case:
```
a: int = 2
s:set = set()
s.add(a)
print(a in s)
```
Expected Output: True
The above program after optimization will have an IR which translates to:
```
a: int = 2
s:set = set()
s.add(2)
print(2 in s)
```
Expected Output: True
This pr focuses on constant propagation and folding scheme, particularly in IR.ts. Since our set implementation currently supports int data type, all of our set initialization, methods will have a simple constant propagation into IR.ts, which matches their implemented constant translation scheme.

# Compiler A: Strings
Not much interaction at this milestone, but probably some in the next stage.
Example Case:
```
x:set = set()
x = {"a","b","c"}
x.has("c")
```
Expected output: True
Currently our set design only supports int data type. Probably in the next milestone, we'll consider support string data type. In their design, when storing a string, they firstly store its length on top of its memory block. We'll consider this memory allocation if we want to make this feature work. That is, store the address of the string memory block in our hash table to construct the set and fetch the elements.