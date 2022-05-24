### 1. Bignums

Supporting Bignums would essentially cause a change in the way we handle the type of numericals and once that is determined, those would be assigned to fields, return values and variables within classes or global methods. These changes do not impact any inhertitance features.

E.g.:

    class A(object):
        a : int = 182841384165841685416854134135
        b : int = 135481653441354138548413384135
        
        def subt(self : A):
            print(self.a - self.b)
    
    class B(A):
        pass
    
    b : B = None
    b = B()
    b.subt()  # prints 47359730724487546868440750000

We do not see any conflicts with this team's PR.

### 2. Built-in libraries

If we consider Python in its entirety, we come across three built-in methods - isinstance(), issubclass() and super() - which fall into the purview of inheritance. Furthermore, the super() method also supports additional built-ins such as super().__getitem__(name) whenever we invoke a member lookup or a method call using it.

E.g.:

    class A(object):
        def get(self):
            print(5)

    class B(A):
        def get(self):
        	super().get()
    
    b : B = None
    b = B()
    print(isinstance(b, A))  # prints True
    print(issubclass(B, A))  # prints True
    print(b.get())  # prints 5

For this team's PR, we do not see any conflicting changes as these built-in methods are not supported yet.

### 3. Closures/first class/anonymous functions

There are two major overlaps with the closures feature with inheritance. First, is in the typechecking module for the isAssignable() method. In order to support 'Callable', the closures team has added checks to the 'isSubType()' method. However, we are also using the same method to check for isSubclass() relationship. We have discussed an approach with the closures team last week so that the same method can be used by both teams by adding another 'or' clause with the isSubclass() method in 'isAssignable()'. This makes the tests mutually exclusive with respect to this check.

The second overlap is in the code generation module, specifically in the 'call_indirect' clause. It had been pointed out to us that as different subclasses will have their methods at different indices, the 'index' property in ir.ts should be of Value type and not a number. We referred to Closure team's ir.ts and have updated our definition of call_indirect so that it works well for both closures and inheritance. It looks like this now:

{ a?: A, tag: "call_indirect", fn: Expr<A>, name: string, methodOffset: Value<A>, arguments: Array<Value<A>> }

E.g.:

    class A(object):
        def add(self, a: int, b: int) -> int:
            return a + b
        
        def call_add(self):
            add_ref: Callable[[int, int], int] = None
            add_ref = self.add
            print(add_ref(5, 8))
    
    class B(A):
        pass
    
    b : B = None
    b = B()
    b.call_add()  # prints 13


### 4. Comprehensions

Any loops and comprehensions are a part of a basic block within a function of a class or a global method. These would not impact inheritance.

E.g.:

    class A(object):
        def print_list(self : A):
            a : List = None
            a = [i for i in range(10) if i < 5]
            print(a)
    
    class B(A):
        pass
    
    b : B = None
    b = B()
    b.print_list()  # prints [0,1,2,3,4]

We do not see any conflicts with this team's PR.

### 5. Destructuring assignment

Destructuring child class objects declared with parent class type would need proper type checking. 

E.g.:

    class A(object):
        pass

    class B(A):
        pass

    a1: A = None
    a2: A = None
    a1, a2 = B(), B()

We have handled subclass type checking so this will work fine. We do not see any other overlapping use cases.

### 6. Error reporting

The one error reporting test case that we saw was overriding __init__. We could not find the actual test case in the implementation, so we do not know what exactly it entails. But if the following code throws an error by error reporting:
   class A(object):
        a: int = 0
        def __init__(self):
                self.a = 1
                
   class B(A):
        def __init__(self):
                self.a = 2
                
According to us, this case should pass, but if it throws an error according to the error reporting group, then this may be a conflict. We will talk to them this week and resolve this.

### 7. Fancy calling conventions
Since this feature deals with just function implementations, it can easily be used in the method calls in our classes.
E.g.:

    class A(object):
        def print_list(self : A, x: int  = 5):
            a : List = None
            
    a1: A = None
    a1 = A()
    a1.print_list()
 
The only change that will automatically happen is the parameter that we use in method calls will automatically have the additional tags that this team implements.

### 8. for loops/iterators
Supporting For Loops and iterators would essentially require the group to declare a new iterator class, like Range(). Since this class can be called like any other class, and it does not inherit any class other than object, these changes do not impact any inhertitance features.

E.g.:

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




    cls:Range = None
    i:int = 0
    cls = Range().new(1, 4)

    for i in cls:
       print(i)
       continue 
       print(i)

    i = 20
    print(i)

We do not see any conflicts with this team''s PR.

### 9. Front-end user interface
The front-end group is planning to implement a visualization of classes,  where the structure of the entire class can be printed. For eg:
                
       class E(object):
            a : int = 1
       class C(object):
            a : bool = True
            e : E = None
            def __init__(self: C):
               self.e = E()
            def d(self: C) -> int:
              return 1
        c : C = None
        c = C()
    // in REPL:
    >>> c
        
    output:
        {
            address: 100
            a: True
            e: {
                address: 108
                a: 1
            }
        }

We believe this feature should not have any merge conflicts, but we need to explain to them our implementation of classes so that they can use the relevant functions to get the information of the class to print. Once we walk them through our implementation in class this week, this feature should be straightforward to implement for them.
                
### 10. Generics and polymorphism
                
There are 2 features that have potential conflicts with the Generics and Polymorphism cases: 
1. The Generics group implements a boxed type Generic[T], which is then assigned to a user defined value at compile time, like int, bool or a class. For this, the generics group uses the isinstance()/ issubtype() calls to check if the type assigned to the generic by the user is actually a valid type, i.e. it has been defined as a class. Thus, we need to expose our class environment/ proper isinstance() calls to ensure that the generics group is properly able to typecheck whether the generic has been assigned to an existing type. For eg:
    class Rat():
        pass
                
    b: Box[Rat] = Box()
    b: Box[Rat] = None
    b = Box()
                
2. When supporting inheritance over classes, we need to support the case where a class is a subtype of a generic class. In this case, we will only know the structure of the superclass at compile time. While this should not lead to any problems, since at compile time we know the exact structure of the superclass and thus can do proper memory allocation, there still might be potential conflicts in edge cases. We are working closely with the generics group to go over cases and ensure our implementations are compatible in this sense. An example of this is:
                
    class Rat(Box[T]):
                pass
 
We believe these are the 2 major conflicts we need to address.
                
### 11. I/O, files
The file I/O implementation have no conflicts with the inheritance as the I/O group's functions and enums are completely orthogonal to classes. The I/O group does most of its work in the JS files and exports APIs that can be called in WASM and run this code. As they build their own enums and work generally with function level APIs, their code should be directly compatible with classes.

Eg:
    f:File = None
    f = open(0, 3)
    f.read(1)
    f.write(1)
    f.close()
    (Here, the whole File class and all its functions are imported from their implementation in JS and thus do not interact with inheritance)


### 13. Lists

 1. The changes in the AST, parser.ts, IR, and type checker do not have direct interaction with the inheritance changes added by us. So we expect these files to work fine after the merge. However, we expect a few conflicts where the line changes overlap but it should be easy to fix. 

  2. Lower:
      
      - Constructors: currently if a class field is of type list then the correct memory won’t be allocated for it. We need to call the list constructor which would generate the correct code for memory allocation depending on the size of the list.
      - Field Lookup: while looking up a field of class that has a list field we need to calculate the correct offset from the starting index. Currently, since we only had integer fields offset was easy to calculate but now we need to consider the list length when calculating the offsets for class fields. Couldn’t find the length as a part of the AST so we might have to add the length information so that we are able to calculate the correct field offset.


  3. Compiler - No conflicts.

  4. Example to test once the above points have been addressed:

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


### 14. Memory management

   1. From our understanding of memory management PR, we won’t think we have any conflicts. Except, in lower when a class constructor is called we need to make sure the offset for the class fields is calculated correctly given we now have metadata stored before the object data.


   2. Example: 
   
    class Rat(object):
        id: int = 123
        y: int = 0
        def __init__(self: Rat):
            self.y = 1
            
    class B(Rat):
       pass
        
    def someFunc() -> Rat:
        r: B = None # Objects created in non local scope
        r = B()
        r.y = 100
        return r


    x: B = None
    x = someFunc()


### 15. Optimization

  1. We couldn’t find any direct interaction between the optimization PR and our inheritance PR. The only interaction that the code optimization has is in runner.ts, where the IR program is passed to the optimizer and returns the optimized code.

  2. We have added a call_indirect tag in IR so the optimization group might have to take that into account.

  3. Example:

    class Single(object): 
        a : int = 1 
        def sum1(self: Single) -> int: 
            return self.a 
            
    class Two(Single): 
        b : int = 2 
        def sum2(self: Two) -> int: 
            return 1*2+6		# optimizer would transform this to 8 
            
    l : Two = None 
    l = Two() 
    print(l.sum2())


### 16. Sets and/or tuples and/or dictionaries

 1. The changes in the AST, parser.ts, IR, and type checker do not have direct interaction with the inheritance changes added by us. So we expect these files to work fine after the merge. However, we expect a few conflicts where the line changes overlap but it should be easy to fix. For example, isSubtype function in the type checker is modified by both the sets and inheritance PR.

  2. Lower:
      
      - Field Lookup: while looking up a field of class that has a string field we need to calculate the correct offset from the starting index. Currently, since we only had integer fields offset was easy to calculate but now we need to consider the set length (currently it’s static i.e 10) when calculating the offsets for class fields.

  3. Compiler - No conflicts.

  4. Example to test once the above points have been addressed:

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


### 17. Strings

   1. The changes in the AST, parser.ts, IR, and type checker do not have direct interaction with the inheritance changes added by us. So we expect these files to work fine after the merge. However, we expect a few conflicts where the line changes overlap but it should be easy to fix. For example, isSubtype function in the type checker is modified by both the strings and inheritance PR.

  2. Lower:
      
      - While calling function lowerClasses strings PR as the blocks and inits variables in addition to env and p.classes. We are not sure if these arguments are necessary to be passed since they are not used anywhere in the method call as of now. Maybe they are required once string class fields support is added.
      - The strings PR also define another function lowerClassVarInit, however, it's never used so we are not sure how string inits inside class would be handled.
      - Constructors: We expect some conflicts to come up in flattenExprToExpr → constructor case. We have modified the constructor case to take into account the superclass fields and also store the vtable method offset for the class in memory. The strings PR on the other hand has modified the constructor so that appropriate allocation takes place for string fields in classes. While resolving conflicts in this section we need to make sure first we get all superclass fields and then have the code that works on allocating space for strings and other types. We also need to make sure the first address stores the class vtable offset and then all the fields are stored.
      - Field Lookup: while looking up a field of class that has a string field we need to calculate the correct offset from the starting index. Currently, since we only had integer fields offset was easy to calculate but now we need to consider the string length (present in AST) when calculating the offsets for class fields.

  3. Compiler - No conflicts.

  4. Example to test once the above points have been addressed:

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
    print(x.c) # prints 3
    print(x.a) # prints 1
