# Design for Optimizations

## Feature and test cases for Week 7

10 test cases that your team commits to passing by the end of week 7. They should be 
meaningfully different from one another. Most of these will be Python programs, like 
print(len("abcd")) should print 4 for the strings group.

In particular, some of the more complex topics like closures, memory management, or 
optimization might not have obvious week-1 candidates. If you’re not sure what you’ll 
be able to get done in a week, ask. There is probably some other kind of test you can 
write other than a Python program.

<ul>
<li>
Constant folding:
If there exists a variable (not a class field access, but a memory variable) of which a constant value can be determined at compile time,
then for every place.

Test case #1
```
a = (4+5)
```
transforms to 
```
a = 9
```
</li>

<li>
Constant folding:
Test case #2
```
if (2 != 2): print(5)
```
transforms to 
```
if (False):
    print(5)
```
</li>

<li>
Constant folding:
Binary expressions of the form where both the arguments to the operator are constant literals (after constant propagation,)
</li>

<li>
Dead code elimination
</li>
</ul>

## List of changes to AST/IR

A list of all changes you want to make to the AST, IR, and built-in libraries to 
support your test cases. This can be through a combination of actual changes you 
make and suggest via PR (e.g. change ast.ts, then push the commit and include it 
in the PR), and listed descriptions in your design.md file. For AST/IR changes, 
write out in detail what’s an expression, what’s a value, what’s a string, etc. 
For new files like memory.wat, describe which functions will go there.

## Description of files/functions/datatypes to be added/ added

A description of any new functions, datatypes, and/or files added to the codebase. 
These can be actual code diffs in the PR or written in your design.md.

## Description of memory layout or value representation

A description of the value representation and memory layout for any new runtime 
values you will add. These should be described in design.md rather than implemented 
directly.