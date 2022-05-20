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

Example Cases:
One test case would be a function that returns another function that returns a list. You could construct a list internally and do some manipulation with the length of the list.

Since we support nested lists (matricies) and length of lists, this could be tested upon in their test cases.

## Comprehensions

I think we will need to work closely with this team in order to get things working between our features. Comprehensions deal mostly with expanding lists and their contents. Looking at their design doc, they use List as a type which isn't what we implemented. Rather, we internally parsed `[int]` and stuff like that to be compiled and stored differently in memory. 

Example Cases:
```
a : [[int]] = None
a = [[j for j in range(3)] for i in range(3)]
```

In the above case, the Comprehensions team should define a variable as such but are free to create the list with comprehensions in any way they like as long as the resulting list is a 2D matrix with integers. 

Another case the comprehensions team mentions is about creating an Iterable. I think this part will be a little complex to integrate as I think it will have to work with the way we layout list values in memory. Currently, we do not support mutable list lengths so it is possible to support the external functions `next()` and `hasNext()` mentioned in their proposal.

## Destructuring assignment

## Error Reporting

## Fancy calling conventions

## For loops/iterators

## Front-end user Interface

## Generics and polymorphism

## I/O, files

## Inheritance

## Memory Management

## Optimization

## Sets/Tuples/Dictionaries

## Strings