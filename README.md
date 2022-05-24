# ChocoPy

### Which features had interactions that you didn’t expect before you started implementing?

+ For the inheritance feature, I did not expect to manipulate the parsed ast structure before starting implementation. During implementation, I found that manually adding the default methods from super classes will make the later vtable implementation and the override mechanism more straightforward and clean. All method-call expressions will go through vtable, even the normal method-call without inheritance built previously. 
+ For the list feature, what I didn't expect is that `[1, 2, 3, True, None]` is a valid list. This list can not be assigned to any variable, but can be stored in memory, and besides, `print([1, 2, 3, True, None][3])` can get `True`.

### What feature are you most proud of in your implementation and why?

+ For the for loop implementation, I utilized the existing while logic. It reduced the repeated code and made the logic converge to one place. This makes later update more easy and clean.
+ For the nested function implementation, we create a new stage called `lambda lifting`. We added this stage after type checking stage, to handle nested function. In this stage, we used a well-designed DFS algorithm to traverse the nested function tree, and for each function node, we successfully changed its name, calculated its nonlocal and local variables, extended its arguments list, and lifted it to the top level of function definitions. 

### What features remain to implement?

+ global
+ There are still some bugs in nested function implementation (when using nonlocal keyword).
+ We develop nested function in another branch (nested_func), so we need to merge this branch after all functions working correctly. 

### Is there anything you’re stuck on?

Everything is good until now. 

At first, we are stuck on nested function implementation. Specfically, we are not sure how to extend the parameters list after lambda lifting, and where to generate a new reference class. But after thinking it carefully, we have made some progress.

### Consider programs that work in Python, but not in ChocoPy, involving strings or lists. Pick one that you think would be a straightforward extension to your compiler – describe how you would implement it. 

+ For the inheritance feature, a straightforward extension will be supporting multiple inheritance. ChocoPy does not support multiple inheritance, but python does. I will change the supperclass field in AST.CLASS from a string to a string list. For every logic containing superclass manipulation, I will extend the logic to iterate over all the super classes. The type check will be more complicated. To determine whether a field exists in all super classes, we previously only need to recursively search all the ancestors like a linked list, but in multi-inheritance, we need to search the whole tree like structure. Besides, we also need to figure out the relationship between all super classes to avoid circular inheritance. It can be abstracted as a circle detect problem which can be solved by topology sort.

### Pick one that you think would be an extremely difficult extension to your compiler – describe why.

+ A difficult extention to strings in our compiler would be the String `format()` method in Python. It is difficult because:

  1. the formatted string can not be pre-allocated as string literals; instead, its allocation need to be based on the evaluations of the parameters passed into `format()`.
  2. `format()` can have a variable number of parameters, which can be either a list of values, a key=value list, or a combination of both.
  3. the placeholders `{}` in `format()` can be identified using named indexes, numbered indexes, or empty placeholders.
  4. inside the placeholders there are many formatting types that need to be supported (e.g., `:e`, `:f`, `:x`, etc.).
