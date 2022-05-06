# Set Dict Tuple Design
## Change to AST and Ir
We made changes to ast.ts and ir.ts to include set, dictionary and tuples. Though we will focus on set but we have included all three types in case other group might refer to these types. Changes in ast and ir are the same as we have not included optimization currently.

Similar to class implementation in PA3, we add three new types under the Type we declared as:
```
export type Type =
    ……
  | { tag: "set"; content_type: Type }
  | { tag: "dict"; key: Type; value: Type }
  | { tag: "tuple"; contentTypes: Array<Type> }
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


# Test Cases
### 1. Set constructor
program:
```
s:set = set()
s.add(3)
print(s)
```
expected output:
```
{3}
```
### 2. Set constructor 2
program:
```
s:set= {3,5,7}
print(s)
```
expected output:
```
{3,5,7}
```
### 3. Add duplicate element
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
program:
```
x:set = {1,2,3}
1 in x
```
expected output:
```
True
```