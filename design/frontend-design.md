## Test Cases
1.  class with two fields
```
    input:
        class C:
            a : int = 1
            b : int = 2
        c : C = None
        c = C()
    // in REPL:
    >>> c
    

    output:
        {
            address: 100
            a: 1
            b: 2
        }
```

2. class with nested class instance
```
   input:
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
```

3.  class with inheritance: 
 we need to wait for the inheritance group to finish their feature.
```
input: 
    class E(object):
        a : int = 1
        f : int = 2
    class C(E):
        a : int = 2
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
            a: 2,
            f: 2,
            e: {
                address: 112
                a: 1
            }
        }
```

4. nested instance with uninitilized instace
```
    input:
    class E(object):
        a : int = 1

    class C(E):
        a : int = 2
        e : E = None
        def d(self: C) -> int:
            return 1
    c : C = None
    c = C()
    // in REPL:
    >>> c

    output:
        {
            address: 0x1234
            a: 1
            e: none
        }
```
5.  Add one HTML component <select></select>:
It would be much more convenient for users to begin with some sample code. We could provide a HTML component listing the example codes. For example, the options of the select could be "example code with class", "example code with closure". Once we click one option, the code would be loaded to the left box on the screen.

6.  Switch the select component:
When we change the option of the select, the example code would be overwritten. When we clicked the "example code with closure" option, the code in the left box would be overwritten.

7. "Clear" button:
Add one clear button near the run button, when we click the "clear", the python code would be disappeared and also the memory and environment would be refreshed. 


8. Syntax highlight:
Refactor the edit box to import the style of CodeMirror to highlight the python syntax in the left box. We need to make sure the style of highlight is exactly the same with what CodeMirror npm provided.


9. Add two buttons for saving and uploading code
By clicking the saving button, we could download the chocopy code to local PC. By clicking uploading button, we could select the file from local PC and load them into the edit box in the left side. 


10. Autocompletion for REPL:
We could autocomplete the builtin function when we interact with REPL environment. 





## design
1. changes on AST, IR, and built-in libraries:
we do not need to change the AST, IR, and built-in libraries.


2. A description of any new functions, datatypes, and/or files added to the codebase:

 
    
    In order to make the compiler pass the test 8, 9 and 10,  we need to make use of CodeMirror to implement details. There must be some changes to some files like <b>webstart.ts</b>. For example, we can build a function that may be named as highLightLine to deal with the need of <b>Syntax Highlight</b>. As for <b>autocompletion </b> functionality, we can create a extra special typescript file to deal with corresponding logics of getting and showing exsited builtin functions we want. Most of changes about these cases are HTML related, and they can be implemented in a relative efficient way in <b>webstart.ts</b> with the usage of various HTML attributes. For instance, the objects with the specified value of ID attribute "load", "save " and others can be directly returned and then be used to achieve the required features.
    
    For the implementation of visulize classes: in order to print the <b>class object</b> from repl commandline, we need to add an another print function, taking the result value of the executed "repl commandline",  the result type returned by the type checking program as the paramters, and BasicRepl Class as parameters. We then use the class info and the memory object of BasicRepl Class to traverse the result value(object address) recursively and combine them into html object.




3. A description of the value representation and memory layout for any new runtime values you will add:
no value representation or memory layout would be add.

