# Project Design 

### Test cases

1. Function & Return Check with Elif

   ```python
   # Expected Error - Not all paths return
   def g(b:int) -> int:
       if (b == 1):
           return 1
       elif (b == 2):
           return 5
       else:
           if (b > 4):
               return 7
           elif (b == 10):
               return 9
   ```

2. Variable Error Check

   ```python
   # Expected Error - Invalid variable names
   123:int = 6
   class bool(object):
       pass
   int:bool = True
   ```

3. List & Strings

   a. List & String Access & Basic Operation

   ```python
   a:[int] = None
   a = [1, 0, 1, 2]
   print(a[2 + 1])
   h:str = "Hello World"
   w:str = " Compiler"
   print(h + w)
   ```

   b. Invalid list access

   ```python
   a:[int] = None
   a[1]
   a:[int] = None
   a = [1, 2, 3, 4]
   a[5]
   ```

   c. Builtins for string and list

   ```python
   a:[bool] = None
   a = [True, False, True]
   print(len(a))
   s:str = "I Love Joe"
   s = input()
   ```

4. For Loops

   ```python
   a:[int] = None
   a = [1, 0, 1, 2]
   i:int = 0
   for i in a:
       print(i)
   a:str = "fdafafa"
   s:str = ""
   for s in a:
       print(s)
   ```

5. Inheritance

   a. multi-level inheritance
   ```python
   class A(object):
      x: int = 0
      def __init__(self: A):
         pass
      
      def add(self: A, y: int) -> int:
         return self.x + y
   
   class B(A):
      pass
      
   class C(B):
      pass
      
   a: C = None
   a = C()
   print(a.add(3))
   ```

   b. methods with the same name
   ```python
   class A(object):
      def getval(self: A) -> int:
         return 0
      
   class B(A):
      def getval(self: B) -> int:
         return 1
   
   class C(A):
      def getval(self: C) -> int:
         return 2
         
   b: B = None
   c: C = None
   b = B()
   c = C()
   print(b.getval() + c.getval())
   ```

6. Nested Functions

    ``` python
    def f(x: int) -> int:
      def nest() -> int:
        return x + 1
      return nest()
    f(10)
    ```
   For non-local use cases

    ``` python
    def foo(x: int) -> int:
        def fie(y: int) -> int:
            return x + fee(y)
        def fee(z: int) -> int:
            nonlocal x
            x = z
            return x+1
        return fie(5) + fie(10)
    foo(9)
    ```

    ``` python
    def foo(x : int) -> int:
        x: int = 0
        def fie() -> int:
            nonlocal x
            return x+1
        return fie()
    foo()
    ```



### Changes to AST.ts / IR.ts

#### Inheritance

- add parent to type class
- add table as an environment in compile.ts

#### String & Lists

- add basic type str
- add access expression

#### For loops

- add for loop statement

#### Nested Functions

- add nested to FunDef



