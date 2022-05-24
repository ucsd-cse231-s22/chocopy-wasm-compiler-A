1. comprehensions
   New Addition:
    for-loop should be able to iterate over comprehensions.  
    Test case:
     
     for i in [e for e in range(1,4) if i!= 2]:
      print(i)

     Output: 0, 1, 3
          
2. Destructuring assignment
    Conflict: 
     The statement in the body of the for-loop assigns iterator to next() value of the class object using assign statement from the code. Currently the name/iterator is string whereas it is modified to destruct in ast.ts for assign statement. This might be a potential merge conflict in the for-loop implementation in lower.ts
    New Additions:
     Iterator in the for-loop can be a destructure with multiple data as iterator. This change needs to be implemented in the for loop.
     Example Test case:
     def func(a: int, b: int)->iterator:
        i : int = 0
        j : int = 0
        i, _, j = range(a, b)
        return range(i, j)
     for i,j in func(10,20):
       print(i)
       print(j)
       
3. Lists
   New Addition:
    Lists, sub-array indexing over lists should be iterable over in the for-loops as values.  Also, a decision decison needs to be taken in terms of whether or not to allow modification of lists (used as values in the loop) in the body of the for-loop.

    Test case:
     items: [int] = None
     items = [0, 1, 2, 5]
     for i in items:
      print(i)

     Output: 0, 1, 2, 5

     Test case:
     items: [int] = None
     items = [0, 1, 2, 5]
     for i in items[0:3]:
      print(i)

     Output: 0, 1, 2, 5
  
4. Sets and/or tuples and/or dictionaries
    New Addition:
     For-loop should be able to iterate over these datastructures. As per their latest commit a constraint on allowing only same type elements is implemented, which is helpful for for-loops as type of iterator cannot change dynamically. When the constraint is removed, necessary changes needs to be done to overcome this issue. Also, a decision decison needs to be taken in terms of whether or not to allow modification of datastructures (used as values in the loop) in the body of the for-loop.
    
    Test case:
          s:set = set()
          s = {1,2,5,7}
          for i in s:
            print(i) 
    Output : 1, 2, 5, 7
    
5. Strings
   New Addition:
    Strings can be included to iterate as values in the for-loop where iterator can be the string/character with length 1. 
    Also, a decision decison needs to be taken in terms of whether or not to allow modification of strings (used as values in the loop) in the body of the for-loop. 

    Test case:
     i:string = "test"
     for i in str:
       print(i)
     Output: t
             e 
             s 
             t

6. Closures/first class/anonymous functions
     New Additions:
       New test cases for for-loops, break, continue within the nested functions can be added to verify their behavior. Not sure of the working of current implementation of break and continue in this scenario. Also, design decision on whether or not to allow defining a function within a loop needs to be considered. 

        def f(y: int) -> int:
            i:int = 0
            for i in range(1,3):
                def fact(x: int) -> int:
                    if x == 1: return 1
                    else: return fact(x-1) * x
            return fact(y)

       Test case:

       def f(y: int) -> int:
            i:int = 0
            for i in range(1,3):
               if i%2==0:
                break
               print(i)
                def fact(x: int) -> int:
                     for i in range(1,3):
                        if i%2==0:
                            break
                        print(i)
                    if x == 1: return 1
                    else: return fact(x-1) * x
            return fact(y)
         

7. Fancy calling conventions
      
      New Additions:
        As of now implementation of builtin range function is not included. Default parameters implementation from this work can be considered during the implementation of range builtin-method to support its variants.
      
      Testcase:
         i:int = 0
         for i in range(3):
            print(i)
      Output: 0, 1, 2

8. Front-end user interface
     This will not have an impact on for loops/iterators. The front end team has made changes mainly to webstart.ts, which has not been changed by us. However to render the iterator, changes might be needed in the function stringify() supported by this team.

9. Generics and polymorphism
   Impact/Conficts
   This will have an impact on the for loops functionality. The return type of the `next` method on the iterator needs to be specialized to account for type-parameter assignment.
   
   Eg:
    T = TypeVar('T')
    class Repeat(Generic[T]):
    elem : T = __ZERO__
    n : int = 0
    i : int = 0
    def hasNext(self: Repeat[T]) -> bool:
        return i < n
    def next(self: Repeat[T]) -> T:
        return elem
    r: Repeat[int] = None
    i: int = 0
    r = Repeat()
    r.elem = 100
    r.n = 10
    for i in r: # will not work because r.hasNext has a return type "typevar"
    print(i)

10. Inheritance
    
    Impact:
    The implementation does not seem to have any impact on the for-loops as only iterating over objects (iterator being a class) is not implemented yet.
    
    In future, when iterating over list of objects is allowed, multiple test cases can be included to verify the expecte behavior.
    
    Test case: 
    class Single(object):
	  a : int = 1
    class Two(Single):
        b : int = 2
    class Three(Two):
        c : int = 3
    
    i:int = 0
    for i in Single():
      print(i)
    
    Expected Output: class doesnot have next/reset/hasnext methods
    
    New Addition:
    For the case where classes have those methods with required return types, the for-loop implementation needs to be changed to include the super class methods for type check etc. 

11. I/O files
    
    Changes related to I/O files will not have an impact on the for loops/ iterators group. Changes for this group are mainly in the compiler.ts and changes made to other files like parser.ts, lower.ts will not have any impact for the iterators functionality.

    Eg: f:File= None
    f= open(0,1)
    print(f.read(1))
    f.close()

12. Memory management
    This will not have an impact on the for loops/ iterators group. Changes for this group have been made on ir.ts, memory.ts (files that we have not changed). Also changes made to lower.ts by this team has no direct impact on the functionality implemented in for loops.

    Eg:
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

13. Optimization
    This will not have an impact on the for loops/ iterators group. Changes for this group have been made by this team on compiler.ts and has no direct impact on the functionality implemented in for loops.
    
    Eg: if the following code was given by the for loops team-

    cls:Range = None
    i:int = 0
    cls = Range().new(1, 4)
    for i in cls:
    print(i)
    i = 10 
    print(i)

    Then the optimization team would convert to the following-

    cls:Range = None
    i:int = 0
    cls = Range().new(1, 4)
    for i in cls:
    print(i)
    i = 10 
    print(10)

    It would replace the i by 10 in the print statement. But no direct impact on the iterator.

14. Big Nums

    This will not have an impact on the for loops/ iterators group. This is because we have our own Range class. The BigNums team has also incorporated functionality They so that they can do addition, multiplication and comparison for large values which is provided by the range class used by the for loops team.

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
    def has(self:Range)->bool:
        return self.current < self.max

15. Builtins
    This will not have an impact on the for loops/ iterators group. The builtins team has made changes to runner.ts and compiler.ts (files that we have not touched). 
    Test cases including the builtin functions from loops should be verified for the expected behavior

    Eg:
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
    def has(self:Range)->bool:
        return self.current < self.max

    cls:Range= None
    cls= Range().new(1, 3)
    i:int=0
    for i in cls:
      print(int(i))
