## Test Cases
1.  class with two fields @sitan, UI @yiming
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
5.  Add one HTML component <select></select>: @yiming
It would be much more convenient for users to begin with some sample code. We could provide a HTML component listing the example codes. For example, the options of the select could be "example code with class", "example code with closure". Once we click one option, the code would be loaded to the left box on the screen.

6.  Switch the select component: @yiming
When we change the option of the select, the example code would be overwritten. When we clicked the "example code with closure" option, the code in the left box would be overwritten.

7. "Clear" button: @shicheng
Add one clear button near the run button, when we click the "clear", the python code would be disappeared and also the memory and environment would be refreshed. 


8. Syntax highlight: @chaowang
Refactor the edit box to import the style of CodeMirror to highlight the python syntax in the left box. We need to make sure the style of highlight is exactly the same with what CodeMirror npm provided.


9. Add two buttons for saving and uploading code @shicheng
By clicking the saving button, we could download the chocopy code to local PC. By clicking uploading button, we could select the file from local PC and load them into the edit box in the left side. 


10. Autocompletion for REPL: @chaowang
We could autocomplete the builtin function when we interact with REPL environment. 





## design
1. changes on AST, IR, and built-in libraries:
we do not need to change the AST, IR, and built-in libraries.


2. A description of any new functions, datatypes, and/or files added to the codebase:

 
    
    In order to make the compiler pass the test 8, 9 and 10,  we need to make use of CodeMirror to implement details. There must be some changes to some files like <b>webstart.ts</b>. For example, we can build a function that may be named as highLightLine to deal with the need of <b>Syntax Highlight</b>. As for <b>autocompletion </b> functionality, we can create a extra special typescript file to deal with corresponding logics of getting and showing exsited builtin functions we want. Most of changes about these cases are HTML related, and they can be implemented in a relative efficient way in <b>webstart.ts</b> with the usage of various HTML attributes. For instance, the objects with the specified value of ID attribute "load", "save " and others can be directly returned and then be used to achieve the required features.
    
    For the implementation of visulize classes: in order to print the <b>class object</b> from repl commandline, we need to add an another print function, taking the result value of the executed "repl commandline",  the result type returned by the type checking program as the paramters, and BasicRepl Class as parameters. We then use the class info and the memory object of BasicRepl Class to traverse the result value(object address) recursively and combine them into html object.




3. A description of the value representation and memory layout for any new runtime values you will add:
no value representation or memory layout would be add.


# Week 7 Homework


## What we should run/test to see what you produced that’s most interesting.
1. select different example code and check the printed object in repl. 
2. click Clear, Choose file and save button to see some interactions.
3. try the editor for auto compeletion and syntax highlight.(this is a interesting feature

Note: the testing framework mocha, which is provided from the starter code, do not provide a web browser envionment. Therefore, we could not run our test cases unless we use mocha-phantomjs as our framework, but it would change the structure of the project.  

## Progress and design idea
### yiming:
We have successfully implemented the functionality of adding code example. Currently we hardcode the code examples in the `webstart.ts`, which can be improved by separating them to another file to make the code more elegant. What code examples are most useful and should be put on the webpage is also a good topic to investigate, and may need the opinions and suggestions from other classmates.

### Shicheng:
The functionality of "clear", "save", "load" buttons are all successfully implemented. It is noteworthy that we use <b>_prompt_</b> which returns <b>null</b> if the "<b>cancel</b>" button is clicked in this process. This special feature was used to solve the bug that as the "cancel" was clicked the document would be still downloaded. In implementing "<b>save</b>" button, The process requires the user to input the file name if he or she wants to download codes, and if the input blank is not filled with anything, the document will be given a default name that is "<b>download</b>". The "<b>clear</b>" button can reset the content in leftside <b>codeTextArea</b>, rightside repl codes, and the running environment, and clicking "<b>load</b>" button can load chosen files' contents as codes in leftside <b>codeTextArea</b>. 

We also update the color and the location of buttons to make the whole page looks more comfortable to users.


### Chaowang:
We successfully implemented the syntax highlight and autocompletion feature. The main change of the feature is in webstart, we init the codeMirror instance after DOMContentLoaded, and we add different eventListeners for codemirror to deal with save, load, and auto completion. I add an independent autocomplete.ts file to achieve the autocomplete feature and another const.ts is used to store the name of built-in functions needed. 

One problem we met is to active the option of syntax highlight, we need to set the config of "mode" and "theme" at the same time, instead of only setting "mode" config. We also need to import corresponing js and css file to enable the highlight for python.

### Sitan Liu:
We followed the original design idea and successfully implemented the object print . With the notice from professor, we added the support for the cyclic likedlist object, by using a set to store the traversed object. Additionally, we add a numeric label to each object, in order not to reprint the traversed object. In this journey, we learned 
* repl internal environment structure 
* the way to manipulate the wasm memory through typescript code 
* the trick to deal with printing cyclic linkedlist. 



# Week8 Design

1. Error Reporting with line highlighted:
    When receiving a error while running the program, we could get a line number of error from error report feature. We could highlight the specific line in left editor.
2. Foldable object print: 
    We could make it more pretty to show the object visualization like using a foldable HTML box.
3. put code examples from hardcode into a file:
    we could extract the hardcode code examples into a independent file, making it more convenient to expand.
4. layout, style and interaction changing of the     webpage:
    We could continue to update the overall UI of the webpage, making it more pretty to look and operate.
5. Show line numbers:
    Show lines numbers for codeMirror editor.