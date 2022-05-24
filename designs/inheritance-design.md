# Milestone 1

</br>

## Test Cases

### 1.  Multilevel Inheritance (without method method overriding)

	class Single(object):
		a : int = 1

		def sum1(self: Single) -> int: 
			return self.a

	class Two(Single):
		b : int = 2

		def sum2(self: Two) -> int: 
			return self.a + self.b

	class Three(Two):
		c : int = 3

		def sum3(self: Three) -> int: 
			return self.a + self.b + self.c

	l : Three = None 
	l = Three()
	print(l.sum3()) # prints 6

### 2.  Inherit from a class that doesn't exist

	class Link(List): # Type Error: Super class not defined: List
	
		val : int = 0 
		next : List = None

		def curval(self: Link) -> int: 
			return self.val
			
	l : Link = None 
	  
### 3.  Method doesn't exist in sub class but present in super class

	class A(object):
	    x: int = 1
    
	    def increment(self: A, i: int) -> int:
	        return self.x + i
        
    
	class B(A):

	    pass
        
	a : A = None
	a = B()
	print(a.increment(1)) # prints 2

### 4.  Re-defined field in subclass

	class A(object):
	    x: int = 1
    
	    def increment(self: A, i: int) -> int:
	        return self.x + i
        
    
	class B(A):
	    x: int = 1 # Type Error: Cannot re-define field x
        
	a : B = None
	a = B()
    
### 5a.  Methods that do not exist in super class (Throws Error)

    class A(object):
		a : int = 1

		def get_a(self: A) -> int: 
			return self.a

	class B(A):
		b : int = 2

		def sum_a_b(self: B) -> int: 
			return self.a + self.b

	l : A = None 
	l = A()
	print(l.sum_a_b()) # Error: There is no function named sum_a_b in class A.
	
### 5b.  Methods that do not exist in super class (Passes)

    class A(object):
		a : int = 1

		def get_a(self: A) -> int: 
			return self.a

	class B(A):
		b : int = 2

		def sum_a_b(self: B) -> int: 
			return self.a + self.b

	l : B = None 
	l = B()
	print(l.sum_a_b()) # Prints 3

### 6.  Check for methods that don't exist in both subclass and super class (Throws Error)

	class A(object):
		a : int = 1

		def __init__(self: A): pass
			
		def get_a(self: A) -> int:
			return self.a

	class B(A):
		b : int = 3
		
		def __init__(self: B): pass
			
		def get_b(self: B) -> int: 
			return self.b
			
	l : B = None
	l = B()
	print(l.get_c()) # Error: Method get_c() does not exist in class B'c scope
	
### 7.  Order of parsing and storing methods

	class A(object):
		a : int = 3

		def get_a(self: A) -> int: 
			return self.a
		def get_a_minus_1(self: A) -> int:
			return self.a - 1

	class B(A):
		b : int = 2

		def get_a_minus_1(self: B) -> int: 
			return self.a - 1
		def get_a(self: B) -> int:
			return self.a

	l : B = None 
	l = B()
	print(l.get_a_minus_1()) # Prints 2, not 3
    
### 8.  Constructors (sub class & super class)

	class A(object):
		a : int = 1

		def __init__(self: A):
			self.a = 2
		def get_a(self: A) -> int:
			return self.a

	class B(A):
		b : int = 3
		
		def __init__(self: B):
			self.b = 4
		def get_b(self: B) -> int: 
			return self.b
			
	l : B = None
	l = B()
	print(l.get_a()) # Prints 2, not 1
	print(l.get_b()) # Prints 4, not 3
	
### 9.  Super class field accessible in sub class object

	class A(object):
		a : int = 1

		def __init__(self: A): pass

	class B(A):
		b : int = 3
		
		def __init__(self: B): pass
	
	class C(B):
		c: int = 5

		def __init__(self: C): pass
			
	l : C = None
	l = C()
	print(l.a) # Print 1
	print(l.b) # Prints 3
    
### 10.  Method overriding

	class List(object):
		def sum(self: List) -> int: 
			return 1/0

	class Empty(List):
		def sum(self: Empty) -> int: 
			return 0

	class Link(List):
		val : int = 0
		next : List = None

		def sum(self: Link) -> int: 
			return self.next.sum() + self.val
		
		def new(self : Link, val : int, next : List) -> Link:
			self.val = val
			self.next = next
			return self

	l : List = None 
	l = Link().new(5, Link().new(13, Empty()))
	print(l.sum()) # prints 18
	
## File Changes

The focus for this milestone is to support inherited fields and non-overridden functions amongst classes.

### type-check.ts

  1. Add a new function to check if a class is a sub class of another class.

### compiler.ts

 1. The compiler will create a WASM table having the all the method calls for each class.
 
 2. Add a data structure that maps each class to its start index in the vtable where the methods for the class are stored. We also need to store this index as an additional i32 field on each object we create so that we can lookup the correct start index for each object.

 3. Add a data structure that maps each class-method pair to an offset.

 Adding 2 and 3 i.e the class start index in the vtable & class-method pair offset would help us determine the the correct location of a class's method in the vtable.


# Milestone 2

</br>

## Features:

### Support overridden methods:
In the first milestone, we focused on variations on inherited fields and laid out a structure for our v-tables to support those fields lookups. We also managed to test out some methods that have been inherited. The case that we do not support right now is Dynamic Dispatch. We plan to support this in the next milestone

</br>

### Multiple Inheritance:
Along with dynamic dispatch, we plan to finally leverage the Array<string> superclasses that we have defined in our ast.ts and ir.ts to support multiple inheritance. We expect the v-table structure for it to be similar with added pointers to the multiple superclasses, keeping the overall skeleton of the feature to be the same.

</br>
</br>

## Test Cases:

### 1. Dynamic dispatch (Passes):

    class Pet(object):
        def speak(self):
            print(0)
    
    class Cat(Pet):
        def speak(self: Cat):
            print(1)

    class Dog(Pet):
        def speak(self: Dog):
            print(2)


    def speak(pet : Pet):
        pet.speak()

    cat : Cat = None
    cat = Cat()
    speak(cat)  # prints 1
    dog : Dog = None
    dog = Dog()
    speak(dog)  # prints 2


### 2. Dynamic dispatch (Throws Error):

    class Pet(object):
        def speak(self):
            print(0)
    
    class Cat(Pet):
        def speak(self: Cat):
            print(1)

    class Dog(object):
        def speak(self: Dog):
            print(2)


    def speak(pet : Pet):
        pet.speak()

    cat : Cat = None
    cat = Cat()
    speak(cat)  # prints 1
    dog : Dog = None
    dog = Dog()
    speak(dog)  # TypeError: Object of class 'Dog' cannot be assigned to class 'Pet'

### 3. Multiple Inheritance (Passes):

    class Pet(object):
        def speak(self):
            print(0)
    
    class Cat(object):
        def speak(self):
            print(1)

    class Kitten(Pet, Cat):
        pass

    kitten : Kitten = None
    kitten = Kitten()
    kitten.speak()  # prints 0


