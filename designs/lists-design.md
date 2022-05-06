# Lists Project Group Design

## Test Cases

1. Constructor & Initialization

```
items: [int] = None
items = [0,1,2]
```

> We expect constructor and initialization statements to be functional and work

2. Indexing

```
items: [int] = None
items = [0, 1, 2]
print(items[1])
```

> We expect to be able to index into lists and get the correct value

3. Length

```
items: [int] = None
Items = [0,1,2]
print(len(items))
```

> We will introduce a global function that will work on lists and be able to return the length of the list

4. Printing

```
items: [int] = None
Items = [0,1,2]
print(items)
```

> We want to be able to support printing the values in the list

5. Concatenation

```
a: [int] = None
b: [int] = None
a = [0,1]
b = [2,3]
print (a + b)
```

> We expect to print a single list with the elements of the second list appended to the first

6. Sub-Array Indexing

```
items: [int] = None
Items = [0,1,2]
print(items[0:1])
```

> This is a Python feature we would like to implement into the compiler. We expect to print or return a reference to the first element in the range.

7. Indexing out of bounds

```
a: [int] = None
a = [0,1]
print(a[5])
```

> We expect this to fail at runtime as the index is out of bounds

8. Lists of lists/objects

```
List of lists/objects
a: [[int]] = None
b: [[C]] = None
class C(object):
    x:int = 3
    pass
a = [[0,1,2], [1,2,3]]
b = [[C(), C()]]
print(a[0][1])
print(b[0][1].x)
```

> We expect the list object type to be of type Type so we can support nested lists and classes.

9.

```
Insert elements to lists
a: [int] = None
a = []
a.insert(0, 1)
print(a[0] == 1)
a.insert(0, 2)
print(a[0] == 2)
```

> The insert function inserts an element to the list at the given index.

10.

```
Remove elements from lists
a: [int] = None
a = [1,2,2,3]
a.remove(1)
print(len(a) == 3)
a.remove(2)
print(len(a) == 2)
```

> The remove function removes all matching elements from the list.

## All Changes to Files

In ast.ts, we plan to add to the Type:

```
{ tag: "list", item-type: Type }
```

add to Stmt:

```
// a[0] = 1
{ a?:A, tag: "item-assign", obj: Expr<A>, idx: number, value: Expr<A> }
```

and add to Expr:

```
{ a?:A, tag: "construct-list", items: Array<Literal> } // [1,2,3]
{ a?:A, tag: "get-item", idx: number } // a[0]
```

We also expect to have changes to the globals so we can support a function to print lists, get the length of the list, and also index the element at the correct offset. Since lists are also mutable and expandable, we're thinking of having some notion of the correct offsets or locations in memory that correspond to the list values. We also need to make some changes in parser, typecheck, and compiler that are corresponding to the changes we made in ast and some of the new syntax rules that the data structure list would support. 
