#ChocoPy
###Which features had interactions that you didn’t expect before you started implementing?
+ For the inheritance feature, I did not expect to manipulate the parsed ast structure before starting implementation. During implementation, I found that manually adding the default methods from super classes will make the later vtable implementation and the override mechanism more straightforward and clean. All method-call expressions will go through vtable, even the normal method-call without inheritance built previously. 

###What feature are you most proud of in your implementation and why?
+ For the for loop implementation, I utilized the existing while logic. It reduced the repeated code and made the logic converge to one place. This makes later update more easy and clean.

###What features remain to implement?

###Is there anything you’re stuck on?

###Consider programs that work in Python, but not in ChocoPy, involving strings or lists. Pick one that you think would be a straightforward extension to your compiler – describe how you would implement it. 
+ For the inheritance feature, a straightforward extension will be supporting multiple inheritance. ChocoPy does not support multiple inheritance, but python does. I will change the supperclass field in AST.CLASS from a string to a string list. For every logic containing superclass manipulation, I will extend the logic to iterate over all the super classes. The type check will be more complicated. To determine whether a field exists in all super classes, we previously only need to recursively search all the ancestors like a linked list, but in multi-inheritance, we need to search the whole tree like structure. Besides, we also need to figure out the relationship between all super classes to avoid circular inheritance. It can be abstracted as a circle detect problem which can be solved by topology sort.

###Pick one that you think would be an extremely difficult extension to your compiler – describe why.
