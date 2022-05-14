# Comprehensions Team Design Doc

## Week 7:
### Test cases implemented and passed:
All test cases were written in the tests/comprehension.test.ts file. Upon running this file, 15/15 teste cases passed. The following are the test cases that pass and produce the required output:

1. simple comprehension output with min and max range
```j: int = 2```
```print([j for a in range(5,7)])```
Output: ```['2', '2']```

2. simple comprehension output with only max range
```j: int = 7```
```print([j for b in range(5)])```
Output: ```['7', '7', '7', '7', '7']```

3. simple comprehension output with bool values
```j: bool = True```
```print([j for c in range(1,5)])```
Output: ```['True', 'True', 'True', 'True']```

4. simple comprehension output with expr values
```j: int = 5```
```print([j*2 for d in range(1,5)])```
Output: ```['10', '10', '10', '10']```

5. simple comprehension output using iterable class methods
```print([e for e in range(1,5)])```
Output: ```['1', '2', '3', '4']```

6. simple comprehension output using iterable class methods and expr values
```print([f*3 for f in range(1,5)])```
Output: ```['3', '6', '9', '12']```

7. simple comprehension output with if condition
```print([g for g in range(1,5)])```
Output: ```['1', '2', '4']```

8. simple comprehension output with bool binop expr values and if condition
```j: int = 3```
```print([j<i for i in range(6) if i>3])```
Output: ```['False', 'False', 'True']```

9. simple comprehension output with function call as expr values
```def f(x:int)->int: return x*5```
```j: int = 5```
```print([f(j) for l in range(5)])```
Output: ```['25', '25', '25', '25', '25]```

10. simple comprehension output with step
```print([k for k in range(10,20,2)])```
Output: ```['10', '12', '14', '16', '18']```

11. invalid expression in comprehension
```print([j for a in range(1,5) if a!=1])```
Output: ```Error: j is undefined```

12. invalid range in comprehension
```j: int = 2```
```print([j for a in range(2,1)])```
Output: ```Error```

13. only if condition allowed in comprehension
```j: int = 2```
```print([j for a in range(1,5) for a!=1])```
Output: ```Error```

14. invalid condition in comprehension
```j: int = 2```
```print([j for a in range(1,5) if a+2])```
Output: ```Error```

15. invalid iterable in comprehension
```j: int = 2```
```k: int = 3```
```print([j for a in k if a!=2])```
Output: ```Error```

One of the test cases that does not work yet is the following:
```print([[j for j in range(3)] for i in range(3)])```

## Some implementation details and issues:

following points needed:

usage of ranged class

type-check and lower file implementations (and limitations?)

changes to ast?




## Week 6:
## Test cases

```
a : List = None
a = [i for i in range(10)]
print(a)
```
This should output ```[0,1,2,3,4,5,6,7,8,9]```

```
a : List = None
j : int = 9
a = [j for i in range(5)]
print(a)
```
This should output ```[9,9,9,9,9]```

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
a = [i for i in range(10,5)]
print(a)
```
This should output ```Error: list range is invalid```

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
j : bool = True
b = [j for i in a]
print(b)
```
This should output ```[True,True,True]```

```
a : int = 5
b : List = None
b = [i for i in a]
print(b)
```
This should output ```Error: variable a is not an iterable```

## Code changes

We plan to have an external class Iterable for now with corresponding ```next()``` and ```hasNext()``` methods. Every time a list comprehension will be done, a new instance of this class will be created and used to assign values to the new list variable. We want to create a seperate file to construct the range class under the directory models. We can talk about the range class in more details after we have a discussion with the lists group and once we start our implementation.

In the ast.ts file,  we plan to add a new Type for lists:
```
{ tag: "list", listitems : Array<Type>}
```

We also add the following to Expr<A>:
```
{  a?: A, tag: "list-construct", items: Array<Expr<A>> } // implemented by the list team. 
{  a?: A, tag: "list-comp", left: Expr<A>, elem: Expr<A>, iterable: Expr<A>, cond?: Stmt<A> }
```



