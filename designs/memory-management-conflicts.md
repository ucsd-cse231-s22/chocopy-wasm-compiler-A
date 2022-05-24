## BigNums

### Representative test case
```python
x : int = 100000000000000
print(x)
```
### Required changes
- Currently the space for the BigNum is being assigned by making `alloc` calls in `compiler.ts`. This is incompatible with our current implementation of storing metadata for an object with the heavily modified `alloc` call in `compiler.ts`. As pointed out in the PR comments, it would be great if the memory allocation was done using `alloc` and `store` calls in `lower.ts`.
- Our code only supports allocation for class types in the current implementation. Integration is pretty easy for us since we only need to recognize that BigInt would be a type where all the fields are integers.

## Buitltins
### Representative test case
```python
x: float = 100000.2345
print(x)
```

### Required changes
Builtins should ideally use the representation given in `ir.ts` and the only interaction we have with that are the `alloc`, `load` and `store` calls. The only interaction the current PR of Builtins has with the memory management is `load` and `store` for the `float` type. The current implemenatation stores floating point values in `f32` WASM type which breaks compatibility with memory management group since we only expect `i32` values. There is a further underlying issue with the current implementation of `float` -- they have to fit inside `f32`. A possible way to remedy this while also maintaining compatibility with the current IR is to add an additional builtin class where an object of the class stores two BigInts -- one for the part before the decimal and one for the rest of the number. Floating point operations can then be defined in terms of BigInt operations.

## Closures/first class/anonymous functions
### Representative test case
```python
def g(y: int, z: int) -> int:
     return y + z
x : Callable[[int, int], int] = None
x = g
print(x(2, 2))
```

### Required changes
The implementation of the first-class functions uses a metadata field to infer the ype of the returned value(see `call_indirect` in `compiler.ts`). This requries a metadata field added to the `alloc` call in `lower.ts`. This part breaks functionality with the memory management group since the fields in the object, size of the object and the offest for the field, in case of a list, are inferrred from the class type. A possible solution would be to reach a consensus on the metadata size and placement in the heap, but a better solution as suggested by Prof. Politz would be to use the following convention for alloc
```javascript
| { tag: "alloc", amount: Value<A>, fixed?: boolean[], rest?: boolean }
```
This would require changes on both our and their end. But these changes would be very isolated in `lower.ts` for the Closures team and in `compiler.ts` for our team.  

## Comprehensions
The Comprehensions group makes their changes in `ast.ts` and in `lower.ts` which have no interation with `alloc`, `load` or `store`. There are also no changes to the IR and comprehensions are implemented using the `Range` class as defined below. Our group mainly makes changes to `compiler.ts` and supports classes/ objects as represented in the IR. There is no interaction between our groups code and that required to implement comprehensions.

### Example program
```python
class Range(object):
     min:int=0
     max:int=0
     curr:int=0
     def __init__(self:Range):
         pass
     def new(self:Range,min:int,max:int)->Range:
         self.min=min
         self.max=max
         self.curr=min
         return self
     def hasNext(self:Range)->bool:
         return self.curr<self.max
     def next(self:Range)->int:
         c:int=0
         c=self.curr
         self.curr=self.curr+1
         return c
 a:Range=None
 b:Range=None
 i:int=0
 j:int=25
 a=Range().new(0,5)
 b=[j for i in a if i!=2]`, ['25', '25', '25', '25']
```
The above program is representative as it showcases that comprehensions are implemented using the `Range` class and presumable ends up becoming a part of the builtins. Since the objects created using the `Range` class are same as any other objects which we support, our features should be plug and play.

## Destructuring assignment
Destructuring deals with syntax and does not affect the IR. We see this in the implementation as their changes are focussed in `ast.ts` and in `lower.ts`. They do not affect anything that has to do with heaps in the IR. 

### Example program
```python
c: cl = None
class cl(Object):
    f1: int = 0
    f2: bool = False
     
c = cl()
c.f1, c.f2 = 1, True
print(c.f1)
print(c.f2)
```
Above program is representative since objects are stored on the heap and it shows using destructuring with object fields. In the IR these would be turned into individual assign calls and should not affect the fucntionality for our group in any way.

## Error reporting
### Representative test case
```python
class C(object):
     x : int = 0
 c1 : C = None
 c2 : C = None
 c1 = C()
 c2.x
```


### Required changes
The Error reporting group replaces `Type` with `Annotation`. This need to be integrated into our current code. The type of the object can still be inferred from the `type` field in `Annotation` and should work easily with our current implementation. We currently throw errors directly and need to switch to the types defined by the Error reporting group in `errors.ts`. All changes are required from our group since the error reporting group does not affect memory allocation in any way.

## Fancy calling conventions
The fancy calling conventions boil down to assign calls in the IR and does not affect the memory management functionality in any way. The changes added by the group are localized in `ast.ts` and `parser.ts` while memory management fucntionality is implemented largely in `compilers.ts` and `memory.wat`. 

### Example program
```python
class C(object):
    x:int = 100

def f(x : int = C().x):
    print(x)

f()
```
Above program is representative as an anonymous object is created and then a property of that object is accessed. This should get converted to appropriate assign calls in the IR. Since this is no different that creating an object and accessing its property without the fancy convention, the changes from both our groups don't interfere.

## For loops/iterators

There doesn't seem to be any real overlap in the files we're changing so far between our groups as they seem to be changing `ast.ts`, `lower.ts`, and `parser.ts` right now while we're mainly changing `compiler.ts` and `memory.wat`. This may change in the future as they start to implement their for loops end-to-end in `compiler.ts`, however. A case we may need to consider for the for loop team is how to handle object creation within loops. This is something we can already start testing without the implementation of for loops as we have while loops, though.

### Example program
``` python

class C(object):
    x : int = 10

for i in range(10):
    c : C = None
    c = C()
    c.x = i

```

The question for this case would be how we would want to handle this creation of objects in the heap and whether we would want to delete each object off of the heap after every iteration as well as how we would want to handle this in the reference counts (whether this one line counts as a single reference or 10 different references due to the loop). In order to make this easier on both parts, it may help for the for loop team to make the number of iterations the loop will have clear as it's passed down to the compiler if possible. Our team could also just figure out a policy for the garbage collector that will optimize heap space with how variables may be used later in the program.

## Front-end user interface

There isn't any real interaction between our features, filewise nor programwise as we seem to be on almost opposite ends of the spectrum in terms of level for the compiler. Something the front-end team might want to consider though is how they would want to print out objects in the REPL.

### Example program
```python

class C(object):
    x : int = 10

c : C = None
c = C()
print(c)

```

There are several possible ways they could print this out in the REPL. They could print out the object type with the address, which would make the most sense. In this case, we would need to make it very accessible for the front-end team to retrieve the addresses. They could also print out the object type with the reference number that it holds which should also lead back to the address given the reference table. However, this option seems like it might lead to some hacky solutions on the front-end side.

## Generics and polymorphism

There doesn't seem to be any overlap in the files that we're changing between our groups as their changes are localized in `ast.ts`, `runner.ts`, `parser.ts`, and their own `monomorphizer.ts.` while our changes reside mainly in `compiler.ts` and `memory.wat`. Something our group might need to handle to handle generics would be to figure out how we want to store the type metadata for classes utilizing generics.

### Example program
```python

T = TypeVar('T')

class D():
    x : int = 10

class C(Generic[T]):
    x : T = __ZERO__
c : C[int] = None
c = C()
c.x = 10

d : C[D] = None
d = C()
d.x = D()
d.x.x = 20
```

In the above program, there are two cases that would affect how the metadata of an instance of the class C would be stored in the heap. In the first case, we would store C as not having any fields that are references while for the second case, we would need to make sure that the field is stored as a reference so that we know to deallocate that later on in the program. Our design might need to change a bit to handle this case when we merge with the generics team as we need analyze the fields of a class case-by-case.

## I/O, files
The I/O team has implemented a File library class with methods like read/write/close. Instances of the class would be stored in the heap just like any other object. The only thing field a File object would have is an int called “fd” that locates where to keep reading/writing from in the actual file. Thus, there is not much special interaction between the I/O team and our team, as long as we correctly allocate and deallocate File objects and count their number of references just like any other object type.

### Example program
```python
f:File = None
f = open(0, 3)
f.read(1)
f.write(1)
f.close()
```
This program is representative since it shows that File objects can be treated as regular objects by the memory management. The data stored in the File object can be represented using the types in IR.


## Inheritance
### Representative test case
```python
class Rat(object):
	x: int = 0

class RatSubClass(Rat):
	y: int = 0

myRat: Rat = None
myRat = RatSubClass()
```

### Required changes
The inheritance group has worked on infrastructure for superclass fields and methods. The Class<A> type now has an Array of strings in the ir/ast that remember the names of all superclasses of that class. The inheritance group does require an addtional metadata field stored along with the object so that the type of the object can be determined at runtime. Similar to the Closures group, this can be easily handled by using the `fixed` and `rest` fields in the newer alloc call. This requires changes from both our teams since we have not yet added support for the new optional fields added to `alloc`.

```javascript
| { tag: "alloc", amount: Value<A>, fixed?: boolean[], rest?: boolean }
```

## Lists
### Representative test case
```python
def first3(a: [int]):
    print(len(a))
    print(a[0])
    print(a[1])
    print(a[2])
first3([1,2,3])
```
### Required changes
The lists team makes changes to `compiler.ts` so as to support the call to get the length of the list using `len`. This breaks compatibility with our implementation since `load` in `compiler.ts` is defined differently to support memory management functionality. A possible resolution is to store the length property as a field in the `List` class and update it whenever there are changes. This implementation would be easily supported using the newer `alloc` syntax.


## Optimization
The Optimization team has implemented constant folding and propagation. This does not have many interactions with our implementation of memory management and how we compute and set the metadata of every object in the heap. Constant folding can affect computation of values but shouldn’t affect how objects are being allocated. 

### Example progam
```python
class Rat(object):
    val: int = 0

def fun1(a: Rat, b:Rat)->int:
           return a.val+b.val
a:Rat = None
b:Rat = None
a.val = 10
b.val = 10
if True:
    if False:
        a.val = fun1(a.val,b.val)
    if True:
        b.val = a.val+b.val%a.val+b.val+a.val+b.val+a.val
print(b.val)
```
The above program is repesentative of the fact that as long as the optimizations dont affect interact with the memeory management functionality. It could happen that an optimization might not allocate an object which could be avoided but might only affects the memory mnanagement module tests. This can be easily remedied with testing on no optimizations and does not require any futher changes. 

## Sets and/or tuples and/or dictionaries
### Representative test case
```python
s:set = set()
s = {1,2,5,7}
s.remove(2)
s.update({2,3,12,13})
s.clear()
```

### Required changes
We currently dont depend on how the sets team does their implementation except for they way they allocate stuff on the heap. The current changes would work with our implementation as long as the specify the alloc calls using the newer syntax. This is because the Sets and/or tuples and/or dictionaries teams' implementation specifies the `set` as a value in `ir.ts` and we would not be able to determine the type of data stored in the set. We do feel that the set implemenation can be abstracted away as a class in `ir.ts`, in which case they could keep using the current `alloc` call in `lower.ts`.

## Strings

### Representative test case
```python
 class A():
    s:str = "abc"
class B():
    s:str = "def"
c: A = None
d: B = None
c = A()
d = B()
print(c.s[0] == d.s[0]) 
```

### Required changes
The string group adds a lot of changes to the `compiler.ts` and `lower.ts` which have to do with storing as retrieval of strings. A lot of this functionality can be abstracted away as builtins for a specific class type `String`. `Strings` can be stored int memeory similar to how `Lists` are stored, collection of 4 chars or 32-bits could form an i32. From this the string object could maintain a property for the length so that they can determine the number of *useful* 8-bit chunks. This alternate implementation would have minimal interaction with `compiler.ts` and allows us from having to deal with edge cases specifically for the string type.  

