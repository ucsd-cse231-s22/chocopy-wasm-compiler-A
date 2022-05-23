# Lists Conflicts with other Features

## BigNums

With BigNums, I think the focus is really on storing a large number in memory as a value opposed to using a BigNum to index. While it is possible, this is an uncommon case and thus, our features don't really interact with each other in this sense. On the other hand, it is possible that our features will overlap here so thus, we would need to discuss on how to correctly identify indexing vs values as well as handling BigNums as indices.

Example Cases:
`a[10000000] = 0`
`a[2^32-1] = 0`

I think we may need to figure out how to handle these cases especially ones at the boundaries for BigNums. I believe for our side on lists, we'd need to check the heap indices and offsets correctly to ensure there is no overflow (because of 4 times a BigNum). 

## Built-in Libraries

Built-in Libraries can cover some similar functions with lists but seem mostly external libraries that may or may not use lists. Given that they seem to be calling external libraries I don't think there's a lot of intersection between our features since they probably would be executing for example native Python code. Furthermore, this group seems to focus on simple imports such as math libraries so the only similarity would be working on mutable list values using math functions.

In terms of scenarios, I think as I mentioned before with mutable list values using imported math functions is probably where these features intersect. I don't really think our implementations would have to change really to get these to work together. For example, if you do something like 

`a[0] = gcd(10,5)`

We get back an integer value that can easily be evaluated and stored in memory.

## Closures/first class/anonymous functions

Since closures just return a function with various types, I think the cases where they test lists would be needed to be updated. This change wouldn't be on our end but rather this team could simply add more tests to return their lists with different types or values.

Example Case:
```
def g(y: [int]) -> int:
    return y[0]
x : Callable[[[int]], int] = None
fs : [Callable[[[int]], int] = None
x = g
fs = [x]
print(fs[0]([1,2,3]))
```

Since we support nested lists (matricies) and length of lists, this could be tested upon in their test cases.

## Comprehensions

Comprehension expressions are generated as a loop in the current implementation. Our code doesn't work well with theirs in a case like:

```
a : [int] = None
a = [i*2 for i in range(0,3)]
print(a[0])
```

To make our and their code compatible, the comprehension group needs to add additional list construction code in `lower.ts` similar to our `construct-list` function. In other words, they need to construct a list on the heap from the comprehension expression and pass the pointer along.

Because list comprehension expression is parsed as `ArrayComprehensionExpression` rather than `ArrayExpression`, it's out of our control to decide what code is generated for it.

## Destructuring assignment

This team will be using some parts of lists. For example, they want to treat lists as possible values in their approach and have the compiler "intelligently" know the destructured value corresponds to a list.

Example Scenario:
```
(a, b, c) = 1, 2, [1,3]
```

In order for such scenarios to work, their code must know where to look up the list memory address and how to handle the representation of lists in memory. It may require some work with the memory management team so it will be easier to write and understand what values are at what addresses when they look things up.

## Error Reporting

The list-related errors overlap with the work of Error Reporting group and need more implementation. The index-out-of-bound error may occur when we are trying to access a list item with an out-of-bound index.

Example Scenario 1 (indexError):
```
a:[int] = None
a = [1,2,3]
a[4] = 4
```
Expected Output: IndexError: (line number, errMsg...)

This code snippet will throw a runtime error, so in their implementation, they need to find the line number where the error occurs and print the corresponding error message that is align with their design choices.

This group also has future plans for better type error. Type checking for arguments of functions print and len overlap with our implementation of print(list) and len(list).

Example Scenario 2 (typeCheck should pass)
```
a:[int] = 1
a = [1,2,3]
print(a)
print(len(a))
```
Expected Output: '[1, 2, 3]', '3'
This code snippet will run without error and print the list and the length of the list. I think the error reporting group should have the list type in mind when they implement the better type checking.

## Fancy calling conventions

This group has some overlapping features with list. Lists can be passed into funcitons as arguments, so all the calling conventions should support list type. 

Example Scenario:
```
a:[int] = None
def addToList(l:[int], n:int = 1, i:int):
  l[i] = l[i] + n
  return l

a = [1,1,1]
addToList(a, i = 1) # [1, 2, 1]
addToList(a, 2, 0) # [3, 2, 1]
addToList([1,2,3], n = 2, i = 2) # would return [1, 2, 5]
```
Expected Output: a would become [3, 2, 1]

During typechecking, they need to add implementation that supports lists in these calling conventions.

## For loops/iterators

This group has overlapping features with list. We should be able to iterate through items in a list using for loop.

Example Scenario:
```
a:[int] = None
a = [1,2,3]
for x in a:
  print(x)
```
Expected Output: '1', '2', '3'

To make this work, we need to make a iterator like range() from a list. We can add additional conditions when a list is used in a for loop, the list should be treated a like an iterator object.


## Front-end user Interface

This group has overlapping features with list. The list symbols '[' and ']', and list members should have corresponding syntax highlights. 

Example Scenario:
```
a:[int] = None
a = [1,2,3]
```

Te front-end group can decide what style goes with their design choices and implement the syntax highlight correspondingly.


## Generics and polymorphism

This group has overlapping features with list. Generics with lists can be useful in some functions, and some lists share some functions with other data structure which would require polymorphism.

Example Scenario 1:
```
def printFirst(list:[any]):
  print(list[0])
```

Our current implementation does not support this. We need to add implementations to support the generic type as a proper item type (changes in ast, typecheck).

Example Scenario 2:
```
len([1,2,3])
len("string")
```
Expected Output: '3', '6'

This group needs to add polymorphism for the len function. Their code should know what the type of the argument is and call the correct len function.

## I/O, files

Our feature and inheritance don't really interact much. The I/O and file feature can read and write files, and both functions do not interact with our feature.

Example Scenario:
```
f:File = None
list:[int] = None

f = open(0, 3)
list = [1,2,3]

f.write(list[0])
f.seek(0)
print(f.read(1))
```

In the example above, it writes the first item of the list to the file, but we do not need to add more features since the list[0] is treated as a number. Writing a whole list to the file or reading the content of a file and assigning to a list can be completed by  combining loop and lists.

## Inheritance

Our feature and inheritance don't really interact much. 

Example Scenario:
```
class A(object):
  a : [int] = None
  def __init__(self: A):
    self.a = [0,0,0]

  def get_a(self: A) -> [int]: 
    return self.a

class B(A):
  b : int = 1

  def __init__(self: B):
    self.b = 2

  def sum_a_b(self: B) -> [int]: 
    for i in range(len(self.a))
      self.a[i] = self.a[i] + b
    return self.a

	l : B = None 
	l = B()
	print(l.sum_a_b())
```
Expected Output: '[2,2,2]'

The example above uses lists and inheritance, but there is no new features needed for this code to run. Inheritance is more about classes, which can use list as types of fields.

## Memory Management

The memory management group had a very general design that should work for any pieces of data stored on the memory. They track the number of references for each varaiables on the heap and perform defragmentation when necessary. If implemented fully and correctly, our lists should be fully managed by the memomry module.

Example Scenario:
```
a:[int] = None
a = [1,2,3]
print(a[0])
a = None
```

We can change our implementation slightly on their request to make their work easier, or share details on how we interact with memory.

## Optimization

The optimization group may be interested in constant-propagation while constructing literal lists.

Example Cases:
```
a: int = None
b: [int] = None
a = 3
print([a, 2*a, 3*a][2])

b = [1,2,3]
print(b[0])
```

However, to optimize in those cases, they will have to deal with values stored in the memory. In addition, indices used to access elements in the list may be propogated from other functions, which makes the work harder.

Because their implementation is very general and solves the optimization problem at a high-level (with scopes and variable tags), if they implement a general memory constant propogation scheme for any data strctures stored on the heap, our implementation should be easily portable under that scheme.

## Sets/Tuples/Dictionaries

These data structures are eventually represented as pointers to some memory chunks on the heap. Therefore, our code should work with their existing implementation.

Example Cases:
```
s:set = set()
a:[set] = None
s = {1,2,5,7}
a[0] = s
print(len(a[0]))
```
Expected Output: 4

## Strings

The strings group had a similar design as ours for list. Strings are eventually stored as an `id` with a pointer to a memory chunk in heap. Because of the similar design we can treat strings as lists of characters. Since our implementation supports list of lists, list of strings should work out of the box.

Example Cases:
```
a:str = None
ss: [str] = None
a = "abcd"
ss = [a, "defg"]
print(ss[0])
print(ss[1])
```
Expected Output: 'abcd', 'defg'