# Set Dict Tuple Design
## Change to AST and IR
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

Additionally, we add set under the literal of ast.ts which need to be used for the type check of set initialization.
```
export type Literal = 
    ……
  | { tag: "set" }
```

In the ir.ts, we add set to the value.
```
export type Value<A> = 
    ……
  | { a?: A, tag: "set"}
```

## Implementation and Memory Management
The set is hashtable-like. Elements are stored using 10 linked list. Each node of the linked list consists of 4 bytes value and 4 bytes address pointing to the next node. Entries for 10 lists are consecutive on the heap. Once `x = set()` is called, 40 bytes of heap memory is assigned to x, which are 10 linked list entries. 

Add function works as:
1. Use the modula to decide the entry the new element should be added to.
2. Iterate the list at the specified entry and if the specified value already exist, do nothing.
3. Iterate the list at the specified entry till the null pointer and call `alloc` function to assign a new address of 8 bytes at the end of the heap.
4. Make the null pointer point to the address of memory just assigned by the `alloc` function.

Remove function works as:
1. Use the modula function to decide the entry which specified value might be at.
2. Iterate the linked list, if the value stored in some node equals the specified value, make the pointer of previous node point to the next node of the current node.
3. If specified element is not in the set, throw an error.

Clear function works as:
1. Set all 10 entries of linked lists to a null pointer.

Has function works as:
1. Use the modula function to decide the entry which specified value might be at.
2. Iterate the following linked list, if there is a node stores the specified value, return True.
3. If value is not found and it is the null pointer, return false.

Size function works as:
1. For all 10 entries, iterate the folloing linked list.
2. Set a global value $size.
3. Iterate all list till the null pointer and each node will add one to $size.
4. Return $size.

Update function works as:
1. Assume we want to add all elements in B to A.
2. Iterate all 10 entries of linked lists in B.
3. For each element stored in B, call A.add(e) to add to A.

## New Functions, Datatypes
This update will add the "Set" Object to the code base. Currently, it supports following methods:
```
Set.add(x)
```
Add x (should be an int) to the set.

```
Set.remove(x)
```
Remove x from the set, if x is not in the set, an error will be thrown.
```
Set.clear()
```
No argument needed, clear the set.

```
Set.update(s)
```
Requires an iterable argument (set, list) and add all elements in s to the set.

```
Set.has(x) - “in” keyword (x in Set)
```
Both expression are acceptable, return True if x is in the set and False otherwise

```
Set.size() - len(Set)
```
No argument needed, returen the number of elements in the set.

# Test Cases
### 1. Set constructor 1
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
print(len(s))
```
expected output:
```
1
```
### 4. Remove element success
Description:

This test case removes an element that exists in the set.

program:
```
s:set = {3,5,7}
s.remove(7)
print(len(s))
```
expected output:
```
2
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
print(len(s))
s.clear()
print(len(s))
```
expected output:
```
3
0
```
### 8. Set.update()
Description:

This test case concatenates two sets into one.

program:
```
x:set = {1,2,3}
y:set = {3,5,7}
x.update(y)
print(len(x))
```
expected output:
```
5
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
print(1 in x)
print(7 in x)
```
expected output:
```
True
False
```

# Week7 Tests
All passed tests are in "set-dict-tuple.test".