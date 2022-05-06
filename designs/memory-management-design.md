# Design Doc

## Week 1 Tests
In the directory designs/, add a file called <projectname>-design.md, with the following contents 10 test cases that your team commits to passing by the end of week 7. They should be meaningfully different from one another. Most of these will be Python programs, like print(len("abcd")) should print 4 for the strings group.
 
In memory, we will annotate each allocated object with metadata about that object. The metadata will be stored as 3 i32 integers: ReferenceCount, Size (in i32 integers), and Type, in that order. The actual object data will immediately follow the metadata. To verify the metadata, we plan to build a Javascript program that can fetch us the ReferenceCount, Size, and Type so we can assert them to expected values. We plan to test this program before employing it for our test cases. 

For now, we won’t be discussing Garbage Collection. We want to focus on implementing functionality for having correct metadata, especially Reference Count. After Reference Counting seems correct, we want to implement functionality to maintain a set of objects with zero references such that Garbage Collection can, in the future, iterate through these objects and deallocate the memory they take up.

<ol>

  <li>Simple Top Level Class Test 1 </li>
  
```
class Rat():
  # Attributes
  y: int = 0
  def __init__(self:Rat):
    self.y = 1
x : Rat = None
x = Rat()
```
  
  assert that Rat has correct metadata: RefCount = 1, size = 4 (3 from metadata + 1 int), type is Rat

  <li> Simple Top Level Class Test 2 </li>

```
class Rat():
  # Attributes
  y: int = 0
  def __init__(self:Rat):
    self.y = 1
x : Rat = None
x = Rat()
y = x
z = y
y = None
```
  
assert that Rat has correct metadata: RefCount = 2, size = 4 (3 from metadata + 1 int), type is Rat
  <li> Subclass Test 1 </li>

```
class Animal():
  # Attributes
  a: int = 0
  def __init__(self:Animal):
    self.a = 1
class Rat(Animal):
  # Attributes
  b: int = 0
  def __init__(self:Rat):
    self.b = 1
x : Animal = None
x = Rat()
y = x
z = y
y = None
```

assert that Rat has correct metadata: RefCount = 2, size = 4 (3 from metadata + 1 int), type is Rat
 
  <li> Object with Object Pointer Test 1 </li>

```
class Animal():
  # Attributes
  a: int = 0
  b: int = 0
  def __init__(self:Animal):
    self.a = 1
class Rat():
  # Attributes
  y: int = 0
  animal: Animal = None
  def __init__(self:Rat):
    self.y = 1
x : Rat = None
x = Rat()
x.animal = Animal()
```

assert that Rat has correct metadata: RefCount = 1, size = 4 (3 from metadata + 1), type is Rat

assert that Animal has correct metadata: RefCount = 1, size = 5 (3 from metadata + 2), type is Animal
 
  <li> Object with Object Pointer Test 2 </li>

```
class Animal():
  # Attributes
  a: int = 0
  b: int = 0
  rat: Rat = None
  def __init__(self:Animal):
    self.a = 1
class Rat():
  # Attributes
  y: int = 0
  animal: Animal = None
  def __init__(self:Rat):
    self.y = 1
x : Rat = None
y : Animal = None
x = Rat()
y = Animal()
x.animal = y
y.rat = x
```
  
assert that Rat has correct metadata: RefCount = 2, size = 4 (3 from metadata + 1), type is Rat

assert that Animal has correct metadata: RefCount = 2, size = 6 (3 from metadata + 3), type is Animal

  <li> Remove Reference Test 1 </li>

```
class Animal():
  # Attributes
  a: int = 0
  b: int = 0
  def __init__(self:Animal):
    self.a = 1
class Rat():
  # Attributes
  y: int = 0
  animal: Animal = None
  def __init__(self:Rat):
    self.y = 1
    self.animal = Animal()


def do_nothing():
  x : Rat = None
  x = Rat()
do_nothing()
```
  
assert that Rat has correct metadata: RefCount = 0, size = 4 (3 from metadata + 2), type is Rat

assert that Animal has correct metadata: RefCount = 0, size =5 (3 from metadata + 2), type is Animal
 
  <li> Zero RefCount Set Test 1 </li>

Using the code from the above test, assert that our set of objects with 0 references contains the address for the Rat object and the address for the Animal object.

</ol>
