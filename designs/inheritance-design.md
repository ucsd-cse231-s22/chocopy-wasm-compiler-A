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



# Update Week 9 - 10

### Closure Merge:

  1. Both inheritance (our) and closure group had added the `classIndices` and `Vtable` in the global environment. The definition of the variables were slightly different according to the requirements of each group. First, closures had added the information about number of parameters for each method in the vtable. Second, we added both start and end index of a class methods in the vtable in `classIndices` but closures group only had the start index. We merged these definitions to create the below:

	vtable: Array<[string, number]> // stores method name and number of parameters in the method
	classIndices: Map<string, [number, number]> // stores the start and end index of a class methods in the vtable
	
  2. Merged the definition of call indirect in the IR and compiler.ts.


  3. Updated the working of our code and closure code so that they work with the new definitions of classIndices and Vtable


  4. Closures group did not have closure or lambda constructors in the vtable, this conflicted with our design of class constructors which were called using the vtable and also made it difficult to handle constructors separately. We updated the code to store closure and lambda constructor in the vtable.


  5. Updated runner.ts `augmentEnv` method to accomodate changes for adding method and field offsets for each class as well as adding closure/lambda as classes in the environment. It would be necesaary to put the method and field information of the closure/lambda in the environment at this point to make sure free and nonlocal variables work when added.


### Generics Merge:

  1. Updated parser to skip generic member expression while parsing class arguements.


  2. Updated generic test cases to have super field in class definition.


  3. Merged definition of class in AST.

	export type Class<A> = { a?: A, name: string, fields: Array<VarInit<A>>, methods: Array<FunDef<A>>, typeParams: Array<string>, super: Array<string> }

  4. Updated type checker environment to store both typeParams and super class information.


	
