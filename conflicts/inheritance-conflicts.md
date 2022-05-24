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

### 7. Fancy calling conventions

### 8. for loops/iterators

### 9. Front-end user interface

### 10. Generics and polymorphism

### 11. I/O, files

### 12. Lists

### 13. Memory management

### 14. Optimization

### 15. Sets and/or tuples and/or dictionaries

### 16. Strings