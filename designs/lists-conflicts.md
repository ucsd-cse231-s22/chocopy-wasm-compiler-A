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

## Error Reporting

## Fancy calling conventions

## For loops/iterators

## Front-end user Interface

## Generics and polymorphism

## I/O, files

## Inheritance

## Memory Management

The memory management group had a very general design that should work for any pieces of data stored on the memory. They track the number of references for each varaiables on the heap and perform defragmentation when necessary. If implemented fully and correctly, our lists should be fully managed by the memomry module.

Example Cases:
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

However, to optimize in those cases, they will have to deal with values stored on the memory. In addition, indices used to access elements in the list may be propogated from other functions, which makes the work harder.

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

## Strings

The strings group had a similar design as ours for list. Strings are eventually stored as an `id` with a pointer to a memory chunk in heap. Because of the similar design we can treat strings as lists of characters. Since our implementation supports list of lists, list of strings should work out of the box.

Example Cases:
```
a:str = None
ss: [str] = None
a = "abcd"
ss = [a, "defg]
print(ss[0])
print(ss[1])
```