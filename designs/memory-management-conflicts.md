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
