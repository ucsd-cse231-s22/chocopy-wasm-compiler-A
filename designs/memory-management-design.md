# Memory management

# Milestone 1

## Updated Tests
### 1. Classes inherited from `object`

**Case:**
```
class Rat(object):
        id: int = 123
        y: int = 0
        def __init__(self: Rat):
            self.y = 1

    x: Rat = None
    x = Rat()
```
**Expected:**
Let `o` be the object referred to by variable `x`
```
assert number of references of o is 1
assert size of o(in bytes) is 4
assert type of the fields in o is [value]
```

### 2. Multiple references

**Case:**
```
class Rat(object):
        id: int = 123
        y: int = 0
        def __init__(self: Rat):
            self.y = 1
    x: Rat = None
    y: Rat = None
    x = Rat()
    y = x
    y = None
```
**Expected:**
Let `o` be the object referred to by variable `x`
```
assert number of references of o is 3
assert size of o(in bytes) is 4
assert type of the fields in o is [value]
```

### 3. Removing references

**Case:**
```
class Rat(object):
        id: int = 123
        y: int = 0
        def __init__(self: Rat):
            self.y = 1
    x: Rat = None
    y: Rat = None
    x = Rat()
    y = x
    y = None
```
**Expected:**
Let `o` be the object referred to by variable `x`
```
assert number of references of o is 1
assert size of o(in bytes) is 4
assert type of the fields in o is [value]
```

### 4. Removing references out of scope

**Case:**
```
class Rat(object):
        id: int = 123
        y: int = 0
        def __init__(self: Rat):
            self.y = 1
        def someFunc(self: Rat):
            r: Rat = None
            r = self
            r.y = 100

    x: Rat = None
    y: Rat = None
    x = Rat()
    x.someFunc()
```
**Expected:**
Let `o` be the object referred to by variable `x`
```
assert number of references of o is 1
assert size of o(in bytes) is 4
assert type of the fields in o is [value]
```

### 5. Objects created in non local scope

**Case:**
```
class Rat(object):
        id: int = 123
        y: int = 0
        def __init__(self: Rat):
            self.y = 1

    def someFunc() -> Rat:
        r: Rat = None
        r = Rat()
        r.y = 100
        return r

    x: Rat = None
    x = someFunc()
```
**Expected:**
Let `o` be the object referred to by variable `x`
```
assert number of references of o is 1
assert size of o(in bytes) is 4
assert type of the fields in o is [value]
```

### 6. Access is not assignment

**Case:**
```
class Rat(object):
        id: int = 123
        y: int = 0
        def __init__(self: Rat):
            self.y = 1

    x: Rat = None
    x = Rat()
    x.y
    print(x.y)
```
**Expected:**
Let `o` be the object referred to by variable `x`
```
assert number of references of o is 1
assert size of o(in bytes) is 4
assert type of the fields in o is [value]
```

### 7: Objects as fields

**Case:**
```
class Link(object):
        id: int = 0
        next: Link = None
        def __init__(self: Link):
            self.id = 123
        def add(l: Link, val: int) -> Link:
            m: Link = None
            m = Link()
            m.id = val
            l.next = m
            return m

    x: Link = None
    y: Link = None
    x = Link()
    y = x.add(456)
```
**Expected:**

Let `o` be the object referred to by variable `x` <br>
Let `p` be the object referred to by variable `y`
```
assert number of references of o is 1
assert type of fields in o is [value, pointer]
assert number of references of p is 2
assert type of fields in p is [value, pointer]
```

### 8. Anonymous object deletion

**Case:**
```
class Link(object):
        id: int = 123
        next: Link = None

        def add(l: Link) -> Link:
            l.next = Link()
            l.id = 456
            return l.next

    x: Link = None
    x = Link()
    x.add()
    x = None
```
**Expected:**
```
assert number of references of any object is 0
```

### 9. Simple linked cycle
**Case:**
```
class Link(object):
        id: int = 0
        next: Link = None

    x: Link = None
    y: Link = None
    x = Link()
    x.id = 123
    y = Link()
    y.id = 456
    x.next = y
    y.next = x
```
**Expected:**

Let `o` be the object referred to by variable `x` <br>
Let `p` be the object referred to by variable `y`
```
assert number of references of o is 2
assert type of fields in o is [value, pointer]
assert number of references of p is 2
assert type of fields in p is [value, pointer]
```

### 10. Simple deletion in cycle
**Case:**
```
class Link(object):
        id: int = 0
        next: Link = None

    x: Link = None
    y: Link = None
    x = Link()
    x.id = 123
    y = Link()
    y.id = 456
    x.next = y
    y.next = x

    x = None
```
**Expected:**

Let `o` be the object referred to by variable `x` <br>
Let `p` be the object referred to by variable `y`
```
assert number of references of o is 1
assert type of fields in o is [value, pointer]
assert number of references of p is 1
assert type of fields in p is [value, pointer]
```

## Updated Changes to IR

We managed to do our implementation without making any changes to IR.

## Added functions/ data types/ files
Functions for reference counting are added to `memory.ts`. We do plan to eventually port things to WASM once we have most functionality for the GC in place and are able to support BigInt and Lists without issues, and have more extensive tests.

## Updated Value representation and memory layout

![Memory layout with metadata](./images/metadata.drawio.png)

The type of a field is denoted by a single bit. For the memory manager we feel that it does not really matter what the type of an field is, as long as we are able to differentiate between data and references to data. The current representation that we plan uses 32 bits to represent types in an object, which puts an upper bound on the number of fields in an object to 32. If needed this number can be easily increased, assigning more bits to storing types in the metadata.

The size of the object is stored in bytes, and the number of references is stored along with the object.

Update: We added an `amount` field to denote the total amount of memory allocated in bytes. `size` field holds the size of a single object in the data stored. The total number of objects associated would then be `(amount - metadatsize) / size`.

### Compaction/ Defragmentation
Performing defragmentation for the heap will move objects around in the heap. Since, we can't go about modifying all the references, each object we create will have an **immutable reference number**. We plan to maintain a mapping from this reference number to the actual location in memory. When compaction takes place we will update this mapping. All variables in the program will store the **reference number** instead of the actual address in memory.

## Updates and Design decisions (Week 2) 

We were able to pass all the tests which we had described last week. The node traversal and the scoping were the most intereresting this week and `Tests 9`, `Test 10`, `Test 4` and `Test 5` are a good representation of the cases we have accounted for. Our tests are present in the `memory.test.ts` file. We had to add a function to `asserts.test.ts` to support testing for memory management functions.

Originally we has planned to do the bulk of our changes at the IR level but we ended up implementing code to add metadata by constructing IR objects. We found that doing so reduced the compexity of our implementation.

We had to make some changes in `compiler.ts` to support some of the memory management functionality. However, this does not break the originial implementation in any way. 

We abstracted out the functionality for memory management in `memory.ts`.

We were a bit unclear at the start of Week 1 as to how we would differentiate between references and values, this part is implemented in `lower.ts`.

We also added another field to denote the total amount of data allocated in bytes, since without this we would not have been able to know how many objects we stored in a contiguous fashion at a given memory location. This allows the array list group to request any amount of data. Note that the `Data` field in the memory metadata diagram denotes the maximum memory which can be allocated by one object. We can however allocate any amount of such objects in a contiguous manner.

We had a bit of a trouble in figuring out how to check if the reference counts that we collect are indeed correct since we don't have access to the variable names. For testing we added a field called `id` to each object which stores a unique identifier for an object. The reference counts and other metadata was tested using this field as an identifier.

# Milestone 2

## Features
### Deleting objects and defragmentation
We currently only track the reference counts of the objects and know when an objects has 0 references. We have to add object deletion and defragmentation so that the space allocated to the *to be deleted* objects can be reclaimed. This will be done by shifting the rest of the objects in the memory and updating the reference -> address mapping. The garbage collection will be deferred to some other time. We plan to determine when this process should happen based on a threshold on the number of references which can be reassigned and also on the total remaining memory. These checks will be performed on an `alloc` call, which in a way is an implicit call to the garbage collector.

### Integration with the Closures/Inheritance/BigInts/Lists group
We noticed that group needs additional metadata in the heap in addition to the object data. We plan to use the newer alloc function as suggested by Prof.Politz
```javascript
| { tag: "alloc", amount: Value<A>, fixed: boolean[], rest: boolean }
```
This would remove the dependency on where metadata is placed for various datatypes and for the memory management group.

### Integration with error reporting
We need to use the error types defined by the error reporting group and use their newer `Annotation` type. 
Note: If the newer `alloc` is implemented then we would not have to rely on inferring the class field types ourselves from the `type` field in annotation, instead this information would be given by the `fixed` field in the newer alloc. 

### Porting to WASM
We plan to port as much functionality as we can from JS in `memory.ts` to WASM in `memory.wat`. We believe this should speed up the memory management functionality by a bit. We plan to do this after making sure our functionality works correctly on the JS implementation.

