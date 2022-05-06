# Memory management

## Tests
### 1. Classes inherited from `object`

**Case:**
```
class Rat(object):
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
    y: int = 0
    def __init__(self: Rat):
        self.y = 1
x: Rat = None
y: Rat = None
z: Rat = None
x = Rat()
y = x
z = y
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
    y: int = 0
    def __init__(self: Rat):
        self.y = 1
def someFunc(z: Rat):
    r: Rat = z
    r.y = 100

x: Rat = None
y: Rat = None
x = Rat()
someFunc(x)
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
    y: int = 0
    def __init__(self: Rat):
		self.y = 1

x: Rat = None
x = Rat()
x
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
    val: int = 0
    next: Link = None
    def add(l: Link) -> Link:
        m: Link = None
        m = Link()
        l.next = m
        return m

x: Link = None
y: Link = None
y = x.add()
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
    val: int = 0
    next: Link = None
    def add(l: Link) -> Link:
        l.next = Link()
        return l.next

x: Link = None
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
    val: int = 0
    next: Link = None

x: Link = None
y: Link = None
x = Link()
y = Link()
x.next = y
y.next = x
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

### 10. Simple deletion in cycle
**Case:**
```
class Link(object):
    val: int = 0
    next: Link = None

x: Link = None
y: Link = None
x = Link()
y = Link()
x.next = y
y.next = x

x = None
```
**Expected:**

Let `o` be the object referred to by variable `x` <br>
Let `p` be the object referred to by variable `y`
```
assert number of references of o is 0
assert type of fields in o is [value, pointer]
assert number of references of p is 1
assert type of fields in p is [value, pointer]
```

## Changes to IR
- 

## Added functions
- 

## Value representation and memory layout
- 
