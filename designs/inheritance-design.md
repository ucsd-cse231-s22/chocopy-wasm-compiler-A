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

# Update Week 8

We were able to pass all the test cases we had committed to in week 7. Below we have listed out changes and the design decisions for each file.

 ### AST

   1. As expected we only had a single change in the AST i.e to add a super field to the class structure. We have it as an array currently as we might plan to support multiple inheritance if time permits. 

	export type Class<A> = { a?: A, name: string, fields: Array<VarInit<A>>, methods: Array<FunDef<A>>, super: Array<string>}

### Parser

   1. While parsing a class we added the code to traverse the superclass arguments. This is similar to traversing the parameters of a function. We then add it to the super field of the class.

### Type checker

1. We updated the type checker environment to store information about the super classes of each class. So now the environment stores information about fields, methods and super class types.

		classes: Map<string, [Map<string, Type>, Map<string, [Array<Type>, Type]>, Array<string>]>

 2. Added a new function to check if a class is a subclass of another class. Also, included a call to this function in isSubtype.

 3. Raise error if subclasses redefined superclass fields

 4. Defined a new function augmentInheritance to type check if superclass exists.

 5. Defined new functions to get super class fields, super class methods, super class names.

 6. Updated field-assign and lookup to check if field exists in super classes of a class and not only the current class's fields.

 7. Updated method call to check if the method exists in super classes of a class and not only the current class's methods.


### IR

   1. Added super field to the class structure.

	export type Class<A> = { a?: A, name: string, fields: Array<VarInit<A>>, methods: Array<FunDef<A>>, super: Array<string>}

   2. Added call indirect as an expression.

	{  a?: A, tag: "call_indirect", fn: Expr<A>, name: string, methodOffset: Value<A>, arguments: Array<Value<A>> } 

### Runner

   1. In augmentEnv function we calculate the offsets for the fields taking into account the super class fields. We first calculate the base offset by finding the number of fields in the super classes. Then we find the offset for the current class fields by adding the base offset and the field number in the current class.

   2. In augmentEnv function we also calculate the method offsets for each class with respect to the base offset for that class in the vtable. If the method is an overridden method we make it's offset the same as the super class method else we increment a counter and assign that as an offset to the method.

   3. Add compiled vtable in the final WAT.

### Lower

   1. We first generate the vtable array using the function generateVtable. The offsets calculated in the runner file help to create and map out the vtable.

   2. We define two new functions, first, getClassFieldOffet which fetches the offset for the passed field and class taking into account searching in the super class fields. Second, getMethodClassName which takes as input the method name and class name and fetches the class which defined the method (this involves searching the super class methods).

   3. Updated field-assign and lookup to use getClassFieldOffet to fetch field offset.

   4. Updated method-call to use call indirect instead of call. Method offset is calculated with the help of the offsets stored in the environment.

   5. Updated construct to use call indirect instead of call. The Constructor also stores the base offset for the current class object at the first memory location. Also, we allocate space for all the fields including super class fields.

### Compiler

  1. Added vtable and classIndexes (stores the starting and ending index of the class's methods in the vtable) in the environment.

  2. Added vtable in the compiled result.

  3. Added code generation for call indirect.

  4. Added code generation for class method definitions.

  5. Added code generation for generating table in WAT.

	
</br>

# Milestone 2

</br>

## Features:

### Integration with other features:

 - Class fields of type lists, sets, strings, etc.
 - Inheritance with generics
 - Closures/first class/anonymous functions

</br>

### Multiple Inheritance:
Along with dynamic dispatch, we finally leverage the Map<string, Array<string>> superclasses that we have defined in our ast.ts and ir.ts to support multiple inheritance. The v-table structure for it is similar to milestone 1 with added pointers to the multiple superclasses, keeping the overall skeleton of the feature to be the same.

</br>

# Updates Week 9 - 10: Integration with other features

### Closure Merge:

  1. Both inheritance (our) and closure group had added the `classIndices` and `Vtable` in the global environment. The definition of the variables were slightly different according to the requirements of each group. First, closures had added the information about number of parameters for each method in the vtable. Second, we added both start and end index of a class methods in the vtable in `classIndices` but closures group only had the start index. We merged these definitions to create the below:

	vtable: Array<[string, number]> // stores method name and number of parameters in the method
	classIndices: Map<string, [number, number]> // stores the start and end index of a class methods in the vtable
	
  2. Merged the definition of call indirect in the IR and compiler.ts.


  3. Updated the working of our code and closure code so that they work with the new definitions of classIndices and Vtable


  4. Closures group did not have closure or lambda constructors in the vtable, this conflicted with our design of class constructors which were called using the vtable and also made it difficult to handle constructors separately. We updated the code to store closure and lambda constructor in the vtable.


  5. Updated runner.ts `augmentEnv` method to accomodate changes for adding method and field offsets for each class as well as adding closure/lambda as classes in the environment. It would be necesaary to put the method and field information of the closure/lambda in the environment at this point to make sure free and nonlocal variables work when added.


### Generics Merge:

  1. Changed the definition of super class data in order to support Generics. Generics group needed information about the type of generic superclass used, so instead of an array with just the superclass names, we agreed on storing this type information as a map with entries containing super class names as key and an array of storing type information as value. The Class definition in the ast is now:
    
	export type Class<A> = { a?: A, name: string, fields: Array<VarInit<A>>, methods: Array<FunDef<A>>, typeParams: Array<string>, super: Map<string, Array<string>> }


  2. Updated parser to store generic member expression for all valid superclasses (whose names are not 'Generic') while parsing class arguments.


  3. Updated type checker environment to store both typeParams and super class information. Also, accomodated the ast change.


  4. Updated monomorphizer to pass on the super class metadata along when the new classes are created.


  5. As the order of class definitions is not maintained after monomorphizing the program, we accomodated super class checks and references in lower.ts and runner.ts to be done in a loop until super class data is found, unlike comparing it directly to super class references created after typechecking.

  6. Changed webstart.ts to pick the first Map when the 'print_class' method is invoked.


### For loops merge:

  1. Changed type checker to look for 'hasnext', 'next' and 'reset' methods in superclass along with the check in current class. This is important for use cases of creating a custom iterator/ inheriting from the Range class.

### Lists Merge:

  1. **List of Inherited Classes**: We were able to smoothly integrate the case in which we have the a list of classes. We are able to access a class using the list index and even access fields and methods using that. A test case has been added for the same.

  2. **Class field of type list**: We weren't able to create a class field of type list. This is mainly because we required an interface in lower.ts that could return the memory allocation and access commands for a list object. However, it hasn't been implemented yet. Once its implemented, we can use that interface in the class constructor or field lookup.


### Destructing Merge: 

There seemed to be an issue with the destructing merge. The test cases for destructing are marked pending, and the fix is yet to be merged by the destructing team. Hence, we weren't able to test destructing with classes and inheritance.

Note: We wanted to test out if inherited fields of type strings, set, tuple, but since these features haven't been merged on the main repository we weren't able to test our code with these features. 



</br>

## Test Cases:

### 1. Dynamic dispatch with function (Passes):

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


### 2. Dynamic dispatch with function (Throws Error):

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
    
### 4. Multiple Inheritance Field Access (Passes):

	class Pet(object):
	    y : int = 1
	    def speak(self):
		print(0)

	class Cat(object):
	    x : int = 0
	    def speak(self):
		print(1)

	class Kitten(Pet, Cat):
	    pass

	kitten : Kitten = None
	kitten = Kitten()
	kitten.speak()   # prints 0
	print(kitten.y)  # prints 1
	print(kitten.x)  # prints 0
	
### 5. Inheritance with sets

	class A(object): 
	    a : int = 1 
	    s1:set = set()
	    def __init__(self: A):
		s1 = {3,5,7}
	    def get(self: A) -> int: 
		return self.s1 

	class B(A): 
	    c : int = 3 

	x : B = None 
	x = B() 
	print(x.s1) # prints {3,5,7}
	x.s1.add(8)
	print(x.s1) # prints {3,5,8}
	
### 6. Inheritance with lists (Passes)

	class A(object): 
	    a : int = 1 
	    itemsa: [int] = None
	    itemsa = [0, 1, 2]
	    def get(self: A) -> int: 
		return self.a 
	class B(A): 
	    itemsb: [int] = None
	    itemsb = [3, 4, 5]
	    c : int = 3 

	x : B = None 
	x = B() 
	print(x.itemsa) # prints [0, 1, 2]
	print(x.itemsb) # prints [3, 4, 5]
	print(x.c) # prints 3
	print(x.a) # prints 1
	
### 7. Inheritance with Strings (Passes)

	class A(object): 
	    a : int = 1 
	    d:  str = “hello A”
	    def get(self: A) -> int: 
		return self.a 
	class B(A): 
	    b : str = “hello B”
	    c : int = 3 

	x : B = None 
	x = B() 
	print(x.b) # prints hello B
	print(x.d) # prints hello A
	print(x.d[0]) # prints h
	print(x.c) # prints 3
	print(x.a) # prints 1
	

### 8. Testing Inheritance with For Loops and Continue (Passes)  
    
	class Range():
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

	class NumberIterator(Range):
	   len: int = 0
	   
	   def new(self:NumberIterator, len: int)->NumberIterator:
	    self.len = len
	    self.min = 0
	    self.current = 0
	    self.max = len
	    return self
	   


	cls:NumberIterator = None
	i:int = 0
	cls = NumberIterator().new(8)

	for i in cls:
	   print(i)
	   continue 
   	   print(i)

### 9. Testing Inheritance with Fancy Calling (Passes)
	class A():
	    x = 0
	    def __init__(self : A, x: int  = 5):
		self.x = x
		
	class B(A):
	    y = 0
	    def __init__(self : B, x: int = 8, y: int = 2):
	        self.y = y
		self.x = x
	    
	a1: A = None
	a1 = A()
	a2: B = None
	a2 = B()
	print(a1.x) // Should print 5
	print(a2.x) // SHould print 8
	print(a2.y) // Should print 2
	
### 10. Testing Inheritance with Generics (Passes)  
	
    L = TypeVar('L')
    R = TypeVar('R')
    
    class A():
    	a: int = 5
	def __init__(self):
	    pass
	    
    class Pair(Generic[L, R], A):
	left: L = __ZERO__
	right: R = __ZERO__
    
    p1 : Pair[int, int] = None
    p1 = Pair()
    p1.left = 10
    p1.right = 20
    
    print(p1.left) // Should print 10
    print(p1.right) // Should print 20
    print(p1.a) // Should print 5
    
    


### Multiple Inheritance:


#### Things that work:

   1. **Constructor**: Constructing objects of a class that inherits from multiple classes works. This involved dynamically calculating the offsets for the superclass fields in lower.ts. We first traverse the multiple superclasses from left to right and recursively add the fields for each of the superclasses to lay out the fields in the memory correctly.

        For example: Let class A have a1,a2 fields, class B have b1,b2 fields, and class C inherits from A & B (in this order) and has c1, c2 fields. Then memory would look like this: 
     
     		Memory Layout -> vtable_offset | a1 | a2 | b1 | b2 | c1 | c2 |

       If class C inherits in order B & A then memory would look like this: 
  
     		Memory Layout -> vtable_offset | b1 | b2 | a1 | a2 | c1 | c2 |

2. **Field Lookup**: for the case of field lookup in multiple inheritance we need to dynamically calculate the correct offset of the given field to access it at the correct location in memory. We looked up the documentation of python to see how python searches and resolves field mapping in case of multiple inheritance. We follow the same strategy of searching i.e we check the derived class first, and if the field is not found in the derived class we then search the superclasses recursively in depth-first - left to right order. 


3. **Parsing, IR, and Type Checking**: our code can parse multiple classes as arguments in a class definition and represent them in the AST and IR. We are also able to type check each of the superclasses (whether superclass exist) in case of multiple inheritance. 


#### Things that don't work:

   1. **Diamond Problem**: this refers to an ambiguity that arises when two classes B and C inherit from A, and class D inherits from both B and C. If there is a method in A that B and C have overridden, and D does not override it, then which version of the method does D inherit: that of B, or that of C? We looked up the specific ways to resolve this but couldn't accommodate these changes due to time constraints. 


	

