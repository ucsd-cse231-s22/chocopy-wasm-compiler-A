# Lists Conflicts with other Features

## BigNums

With BigNums, I think the focus is really on storing a large number in memory as a value opposed to using a BigNum to index. While it is possible, this is an uncommon case and thus, our features don't really interact with each other in this sense. On the other hand, it is possible that our features will overlap here so thus, we would need to discuss on how to correctly identify indexing vs values as well as handling BigNums as indices.

Example Cases:
`a[10000000] = 0`
`a[2^32-1] = 0`

I think we may need to figure out how to handle these cases especially ones at the boundaries for BigNums. I believe for our side on lists, we'd need to check the heap indices and offsets correctly to ensure there is no overflow (because of 4 times a BigNum). 

## Built-in Libraries

## Closures/first class/anonymous functions

## Comprehensions

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