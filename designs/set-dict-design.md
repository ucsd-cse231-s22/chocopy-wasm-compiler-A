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

Additionally, we add set and dict under the literal of ast.ts which need to be used for the type check of set initialization.
```
export type Literal = 
    ……
  | { tag: "set" }
  | { tag: "dict" }
```

In the ir.ts, we add set to the value.
```
export type Value<A> = 
    ……
  | { a?: A, tag: "set" }
  | { a?: A, tag: "dict" }
```

## Implementation and Memory Management for Set
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

## Implementation and Memory Management for Dict
Implementation for dict is similar to set implementation except that each node takes 12 bytes. First 4 bytes is the key of the dict element. Then, it takes 4 bytes to store the value. The last 4 bytes are used as pointer similar to set.

## New Functions, Datatypes for Set
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

# Test Cases for Week 9
### 1. Dict constructor 1
Description:

This test case uses the dict() function to create a dict object. It adds pair (3,2) into the dict, and prints the value related to key 3.

program:
```
s:dict = dict()
s[3] = 2
print(s[3])
```
expected output:
```
2
```
### 2. Dict constructor 2
program:
```
s:dict = dict()
s = {3:2}
print(s[3])
```
expected output:
```
2
```

### 3. Add element with the same key
Description:

This test case tries to add elements with the same key into a set, then print the value. The expected value should be the later one added to the dict.

program:
```
s:dict = dict()
s[3] = 2
s[3] = 4
print(s[3])
```
expected output:
```
4
```
### 4. Pop element success
Description:

This test case removes an element that exists in the dict and return the value of the element.

program:
```
s:dict = dict()
s[5] = 4
print(len(s))
print(s.pop(5))
print(len(s))
```
expected output:
```
1, 4, 0
```
### 5. Pop element fail 1
Description:

This test case tries to remove a non-existent key, an error will be thrown.

program:
```
s:dict = dict()
s[5] = 4
print(s.pop(7))
```
expected output:
```
Key Error: 7
```

### 6. Pop element fail 2
Description:

This test case tries to pop multiple elements at a time, an error will be thrown.

program:
```
s:dict = dict()
s[5] = 4
print(s.pop(7,3))
```
expected output:
```
TypeError: pop() takes exactly one argument (2 given)
```

### 7. Dict.clear()
Description:

This test case deletes all elements inside the dict and turns it into an empty dict().

program:
```
s:dict = {3:4,4:5,5:6}
print(len(s))
s.clear()
print(len(s))
```
expected output:
```
3
0
```

### 10. in keyword
Description:

This test case uses 'in' keywords to judge whether an key is in the dict.

program:
```
s:dict = {3:4,4:5,5:6}
print(3 in s)
print(8 in s)
```
expected output:
```
True
False
```