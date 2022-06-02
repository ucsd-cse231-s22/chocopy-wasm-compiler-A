# Fancy calling conventions-conflicts

## Bignums
Their design focuses on the integers during lower and compiler stages, while ours doesn't modify any feature of literal or any thing during lower stage and compiler stage

```python=
def f(a=100000000000000000000000):
    print(a)

f() # 100000000000000000000000
f(a=100000000000000000000001) # 100000000000000000000001
```

Keyword argument assignment and default value on function definition are the two features we implemented now. If the two features can work with big num, it is reasonable that we can interact well.

## Built-in libraries
Their design changes things about build-in functions. Though it seems similar with our tasks, we focuses on the "call" and "method-call" expressions instead of "buildin*"

I don't think we can show a good example for our interaction, because we are in the parallel level.

But one thing worthy to be mentioned, their add an additional expression called "buildinarb" for build-in functions with arbitrary arguments. It shared similar features with our unimplemented feature (`*args`, `**kwargs`). Although, there is no concern about the conflict, it would be great if we can share the arbitrary arguments feature.



## Closures/first class/anonymous functions

Both of two teams change several similar stuff:
- `ast.ts`
    - `call` in `Expr`
    - `FunDef`
- `parser.ts`
    - `traverseFunDef` 
    - `CallExpression` of `traverseExpr`
- `type-check.ts`
    - `tcDef`
    - `call` in `tcExpr`

But after look at them closely, for most of them, we can resolve the conflict very easily.

The only 2 things, we need to notice are: 
1. the `Type` of Env in `type-checker` is `Parameter` now, so somewhere Closures team use it need to be careful.
2. the `expr.name` of `call`-expr is a expression now, so we need to be careful about that.

Also, we found that in `tcExpr` in `typecheck.ts`, they change the logic for checking `call`-expr. The original logic (which we follow) is like:

```python
if (func is constructor):
    ...
else if (func def can be found in env):
    ...
else:
    error: func not defined
```

But since they see func as var(id) too, and put func in `var` in `env`, their logic becomes:

```python
if (func is constructor):
    ...
else:
    tcExpr(func) # this will check if func id is in env
    if (func is not callable):
        error: not callable
    ...
```

There is a conflict that we cannot solve individually, but we have provided `tcCallOrMethod()` for checking the arguments. We think it should be easier for them to use our function in their logic than the contrary to solve the conflict.

```python=
def g(a: int = 100) -> int:
    return a


def f(g: Callable[[int], int], a: int=5) -> int:
    return g(a) + g()


x : Callable[[int], int] = None
x = f()
print(x(10)) # 110
```


## comprehensions

Aside from coding style conflicts (e.g., import, newline, space), we don't have much things overlaping.

However, this PR cannot even work without `List`. It's hard to give a more comprehensive evaluation.

Ideally, the following testcase can check the validation of combination of our topic and this topic.

```python=
a : List = None
a = [(i+2) for i in [1, 2, 3]]

def f(a: List = a):
    print(a)

f()
f([3, 4, 5])
```


## Destructuring assignment

Aside from coding style conflicts (e.g., import, newline, space), we don't have much things overlaping, because their check only apply on assignment

```python=
def f(a: int = 3, b: int = 4, c: int = 5) -> tuple:
    return (a, b, c)

a, b, c = f()
a, b, c = f(5, c=3)
```

## Error reporting

There's no too much functional-wise overlapping. Their changes for annotation should be easy to merge. However, they need to add another error messages to deal with the error from keyword and default value that we implemented.

```python=
def f(x:int = true): # Should get error message about which row/col
    print(x)
```

## for loops/iterators

Looks like their work could be done by purely adding new statement, and they didn't make changes on original stuff. Thus, I think it should be totally fine to merge our code directly.

The following example shows that we focus on function definition and `call` expression, but they focus on `for` statement in `body`. Our code should be able to merge since those are not overlapped.

```python=
class Range(object):
  current : int = 0
  min : int = 0
  max : int = 0
  def new(self:Range, min:int, max:int)->Range:
    self.min = min
    self.current = min
    self.max = max
    return self
  def next(self:Range)->int:
    c : int = 0
    c = self.current
    self.current = self.current + 1
    return c
  def hasnext(self:Range)->bool:
    return self.current < self.max

def f(x:int = 3):
  cls:Range = None
  i:int = 0
  cls = Range(0, x).new()
  for i in cls:
    print(i)

f() # 0, 1, 2
```

## Front-end user interface

It seems really great and awesome. 
Nothing conflicts here.

```python=
def f(x : int, y : int = 5, z : int = 10):
    print(x)
    print(y)
    print(z)

#expected [1,5,5]
f(1, z=5)
```
This program contains our 2 main features, default values and keyword arguments. It should be good to show our functionality being well.

## Generics and polymorphism

Their work focuses on parameterizing classes and function with types. They add a new type called `TypeVar`, and add `params: Array<Type>` as part of the definition of class. Since those type-check routines are wrapped in functions, ideally we could just call those functions to check, so I think there shouldn't be too many conflicts. We both add new attributes into `GlobalTypeEnv` so there are conflicts, but they shouldn't be hard to solve since those are quite separated.

The following test case checks that if type check could deal with generic type and default value. 

```python=
class Box(Generic[T]):
    f : T = __ZERO__
    def getF(self: "Box[T]") -> T:
        return self.f
    def resetF(self: "Box[T]", f: T = __ZERO__):
        self.f = f
    def setFInt(self: "Box[T]", f: T = 100):
        self.f = f
    def setFBool(self: "Box[T]", f: T = True):
        self.f = f

b : Box[int] = None
b = Box()
print(b.getF()) # prints 0 (zero value of int)
b.setFInt(10)
print(b.getF()) # prints 10
b.setFInt()
print(b.getF()) # prints 100
b.resetF()
print(b.getF()) # prints 0
b.setFBool()
print(b.getF()) # error
```

## I/O, files

They almost change nothing in `parser.ts` and `type-check.ts`, and I/O is really a different level thing to our topic, so I think there shouldn't be problems for merge. 

This test case shows that if `File` object could be default value.

```python=
def writeOrCreate(f:File = File()):
    f.write(1)

writeOrCreate() 
```

## Inheritance

Their implementation focuses on super class and overriding the correct functions, so we don't have too much overlap. They add new attributes to `GlobalTypeEnv:class`, but shouldn't be hard to merge. For `method-call` in `tcExpr`, they add another branch for inheritance function. They should call our new function `tcCallorMethod` for checking all the calls and method calls. Again, not a serious conflict.

This program could see if default value and super class could work fine together.

```python=
class A(object):
	a : int = 1
	def __init__(self: "A"): pass
	def get_a(self: "A", x:int  = 1) -> int:
		return self.a + x
class B(A):
	b : int = 3
	def __init__(self: "B"): pass
	def get_b(self: "B", x:int = 2) -> int: 
		return self.b + x
		
l : B = None
l = B()
print(l.get_a())  # 2
print(l.get_b())  # 5
print(l.get_b(1)) # 4
```

## Lists
It seems that this list only supports same type of element in the list. 
```python=
def f(l:list = [123, '123']):
    print(l)
f()
# expected result should print out [123, '123']
# get a syntax error since we didn't give it a itermType
```
Another issue is that if we pass the list into a function as default value, and then change the element value of the list, it should change the default value that since it passes by reference. 
```python=
items: [int] = None
items = [0,1,2]
def f(l:[int]=items):
    l[0] = l[0] + 1
    print(l)
f() # expected [1,1,2]
f() # expected [2,1,2]
items.append(0)
f() # expected [3,1,2,0]
```
#### Intersting part of between list and function!!!
There is a feature(pitfall) in python that if we use list as a default argument, it's kind of a member data in that function, which is kind of strange. We found a solution on stack overflow and not sure do we need to deal with this task to make it beheavors same as python?
[What is the pythonic way to avoid default parameters that are lists?](https://stackoverflow.com/questions/366422/what-is-the-pythonic-way-to-avoid-default-parameters-that-are-empty-lists)
```python=
def f(l:[int]=[0,1,2]):
    l[0] = l[0] + 1
    print(l)
f() # expected [1,1,2] 
f() # expected [2,1,2] but will get [1,1,2] 
f() # expected [3,1,2] but will get [1,1,2] 
```
For the general use of list, I think there is no conflict if we pass the list as a argument into a function.
```python=
items: [int] = None
items = [0,1,2]
def f(l:[int]):
    print(l)
f(items)
# expected result should print out [0,1,2]
````

## Memory management
The memory management change the storage into specific data structure(32 bits ref, 32 bits allocated.....), and most of the changes are in `compiler.ts` and `memory.ts` so I think there is no conflict between us.

## Optimization
It seems that the optimization set is completely independant step after `lower`, and they add a `iotunauzatuib_utils.ts` as a helper function. Our works focus on parser.ts and type-checker so basically there is no conflict.
```python=
# Constant propagation:
b = 3 + 6
def f(a:int = 8):
    return a + b * 3

# transforms to
b = 9 # from folding
def f(a:int = 8):
    return a + 27 # prpagation and folding 
f() # expected return 35
```
## Sets and/or tuples and/or dictionaries
Similar to the list, set,dict and tuple only support on the same type currently. Therefore, if we want to move to stage2(function with *args and **kwargs), it will constrain our function call.
(At this point, they only support set)
```python=
def f(*args, **kwargs):
    print(args,kwargs)
f(1, 2, 3, '123', m=7, n='123')
# expected result should print out (1,2,3,'123') {'k':7, 'n':123}
# get a syntax error since we didn't give it a itermType
```

General set as function argument.
There is no conflict in the parser and they add a setTC.ts to do the type check, and there is no onverlapping over our function call, so think there is little conflict.
```python=
def f(s:set = {3,5,7}):
    print(s)
f() # expected result should print out {3,5,7}
f({2,4,6}) # expected result should print out {2,4,6}
```
## Strings
There is no such a feature in string when it becomes the default argument of the function. There is no indexing issue in our calling convention(it's more related to list), so I there is no conflict in this part.

Great thing in their change!!!
This can make our calling convention more pyhton-like since it support the initializations such as  `l: [int] = [1, 2, 3]` and `c: C = C()` where `C` is a class object. 
```typescript
AST.VarInit<A> = { a?: A, name: string, type: Type, value: Literal } to AST.VarInit<A> = { a?: A, name: string, type: Type, value: Expr<A> }
```
```python=
def f(s1:str = 'ab'):
    s1 += '_'
    print(s1)
f() # expected ab_
f() # expected ab_
f() # expected ab_

s2:str = 'abc'
def f(s:str):
    print(s)
f(s2) # expected abc
f(s2[:1]) # expected a
f(s2[1:]) # expected bc

```
