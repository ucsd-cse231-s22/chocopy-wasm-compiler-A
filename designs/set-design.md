# Set Dict Tuple Design
## Change to AST and Ir
We made changes to ast.ts and ir.ts to include set, dictionary and tuples. Though we will focus on set but we have included all three types in case other group might refer to these types. Changes in ast and ir are the same as we have not included optimization currently.

Similar to class implementation in PA3, we add three new types under the Type we declared as:
```
export type Type =
    ……
  | { tag: "set", content_type: Type }
  | { tag: "dict", key: Type; value: Type }
  | { tag: "tuple", contentTypes: Array<Type> }
```
It can be used in typechecker to decide the type for each inirtialized objects. And now we have made a constraint that all elements in the set or dict or tuple should be of the same type. We might allow various types in the future.

Then in the expression, the change we have made is as:
```
export type Expr<A> =
    ……
 | { a?: A, tag: "set_expr", contents: Array<Expr<A>> }
 | { a?: A, tag: "tuple_expr", contents: Array<Expr<A>> }
 | { a?: A, tag: "dict_expr", entries: Array<[Expr<A>, Expr<A>]> }
```
## Value Representation and Memory Management
All Values are stored as 8-byte i32. Memory management should use the interface provided by the memory group, the memory usage should be kept below 30% to maintain the efficiency of the hash function. 

## New Functions, Datatypes
This update will add the "Set" Object to the code base. Currently, it supports following methods:

Set.add()

Set.remove()

Set.clear()

Set.update()

Set.has() - “in” keyword (x in Set)

Set.size() - len(Set)

# Test Cases
### 1. Set constructor
Description:

This test case uses the set() function to create a set object. It adds element 3 into the set, and prints the whole set.

program:
```
s:set = set()
s.add(3)
print(len(s))
```
expected output:
```
1
```
### 2. Set constructor 2
Description: 

This test case creates set with {x1,x2,...} statements.

program:
```
s:set = set()
s = {3,5,7}
print(s)
```
expected output:
```
{3,5,7}
```
### 3. Add duplicate element
Description:

This test case tries to add duplicate elements into a set, then print the set. The set should ONLY contain 1 element, that is 3.

program:
```
s:set = set()
s.add(3)
s.add(3)
print(s)
```
expected output:
```
{3}
```
### 4. Remove element success
Description:

This test case removes an element that exists in the set.

program:
```
s:set = {3,5,7}
s.remove(7)
print(s)
```
expected output:
```
{3,5}
```
### 5. Remove element fail 1
Description:

This test case tries to remove a non-existent element, an error will be thrown.

program:
```
s:set = {3,5,7}
s.remove(6)
print(s)
```
expected output:
```
KeyError: 6
```
### 6. Remove element fail 2
Description:

This test case tries to remove multiple elements at a time, an error will be thrown.

program:
```
s:set = {3,5,7}
s.remove(3,5)
print(s)
```
expected output:
```
TypeError: remove() takes exactly one argument (2 given)
```
### 7. Set.clear()
Description:

This test case deletes all elements inside the set and turns it into an empty set().

program:
```
s:set = {3,5,7}
print(s)
s.clear()
print(s)
```
expected output:
```
{3,5,7}
set()
```
### 8. Set.update()
Description:

This test case concatenates two sets into one.

program:
```
x:set = {1,2,3}
y:set = {3,5,7}
x.update(y)
print(x)
```
expected output:
```
{1, 2, 3, 5, 7}
```
### 9. Set.update() fail
Description:

This test case tries to update the original set with a non-iterable. The compiler will throw an error.

program:
```
x:set = {1,2,3}
y:int = 1
x.update(y)
print(x)
```
expected output:
```
TypeError: 'int' object is not iterable
```
### 10. in keyword
Description:

This test case uses 'in' keywords to judge whether an element is in the set.

program:
```
x:set = {1,2,3}
1 in x
7 in x
```
expected output:
```
True
False
```

# Week7 Implementation
All passed tests are in "set-dict-tuple.test".