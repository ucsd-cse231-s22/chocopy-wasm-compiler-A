# Comprehensions Team Design Doc

## Test cases

```
a : List = None
a = [i for i in range(10)]
print(a)
```
This should output ```[0,1,2,3,4,5,6,7,8,9]```

```
a : List = None
a = [j for i in range(10)]
print(a)
```
This should output ```Error: j is not defined```

```
a : List = None
a = [i for i in range(5,10)]
print(a)
```
This should output ```[5,6,7,8,9]```

```
a : List = None
a = [i for i in range(10) if i < 5]
print(a)
```
This should output ```[0,1,2,3,4]```

```
a : List = None
a = [i for i in range(10) return]
print(a)
```
This should output ```Error: only if condition allowed```

```
a : List = None
b : List = None
a = [1,2,3]
b = [i*2 for i in a]
print(b)
```
This should output ```[2,4,6]```

```
a : List = None
a = [[j for j in range(3)] for i in range(3)]
print(a)
```
This should output ```[[0, 1, 2], [0, 1, 2], [0, 1, 2]]```

```
a : List = None
b : List = None
a = [1,2,3]
b = ['hi' for i in a]
print(b)
```
This should output ```['hi','hi','hi']```

```
a : int = 5
b : List = None
b = [i for i in a]
print(b)
```
This should output ```Error: variable a is not an iterable```

## Code changes

We plan to have an external class Iterable for now with corresponding ```next()``` and ```hasNext()``` methods. Every time a list comprehension will be done, a new instance of this class will be created and used to assign values to the new list variable.

In the ast.ts file,  we plan to add a new Type for lists:
```
{tag: "list", name: string}
```

We also add the following to Expr<A>:
```
{a?: A, tag: "list-comp", name: string, left: Expr<A>, elem: Literal, items: Array<Literal>, cond?: Stmt<A> }
```