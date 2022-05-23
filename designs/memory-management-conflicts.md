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
| { tag: "alloc", amount: Value<A>, fixed: boolean[], rest: boolean }
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

### Compiler A: I/O, files
The I/O team has implemented a File library class with methods like read/write/close. Instances of the class would be stored in the heap just like any other object. The only thing field a File object would have is an int called “fd” that locates where to keep reading/writing from in the actual file. Thus, there is not much special interaction between the I/O team and our team, as long as we correctly allocate and deallocate File objects and count their number of references just like any other object type.

### Compiler A: Inheritance
The inheritance group has worked on infrastructure for superclass fields and methods. The Class<A> type now has an Array of strings in the ir/ast that remember the names of all superclasses of that class. In order for their code to work with ours, we would need for them to allocate superclass fields as expected: immediately before the subclass fields of the same object in the heap.
```
class Rat(object):
	x: int = 0

class RatSubClass(Rat):
	y: int = 0

myRat: Rat = None
myRat = RatSubClass()
```

Data of `myRat` in the heap should be allocated in the order: `x`, `y`
There is a currently a `TODO` in their code for getting superclass fields from the environment, so it seems that this is something that needs to be done. 

### Compiler A: Lists
The lists team currently writes their code in lower.ts to call `store` for each element in the list. This makes the list dynamically-sized. We have somewhat already accounted for this by allowing multiple objects in the heap (with multiple object data areas) to be allocated per large object, such as lists. These multiple objects can lay in contiguous memory locations and will be kept track of with our “size” metadata field. One issue we may run into is when a list is expanded and needs more space after a different object has been created in the heap blocks immediately after the list object’s heap blocks. This would mean that we would need to allocate a new heap object that is non-contingous with the original list object, perhaps requiring a reference of some sorts to point to the new object. We may have to rethink our design if this issue actually exists, but we will have to discuss it more with each other. 

### Compiler A: Optimization
The Optimization team has implemented constant folding and propagation. This does not have many interactions with our implementation of memory management and how we compute and set the metadata of every object in the heap. Constant folding can affect computation of values but shouldn’t affect how objects are being allocated. While constant folding and propagation can impact the results of functions, it currently does not even affect methods, inherited methods, or polymorphism since all of those will resolve dynamically (and also don’t have much to do with us).

### Compiler A: Sets and/or tuples and/or dictionaries
This team currently writes their code in lower.ts to allocate a set of fixed size of 10. Eventually, when they create dynamically sized data structures, we have to think about their structures the same way we think about the list team’s, with the same possible issues with dynamic-sizing. Issues we solve with the list team should also mean that we have solved the same issues for these data structures. 
