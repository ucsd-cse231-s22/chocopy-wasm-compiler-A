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

<li>
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
Test case #2

```
if (not False):
```
transforms to 

```
if (True):
```

</li>
<li>
Constant folding:
Test case #3

```
while (3 < (2%(4//1))**4>):
```
transforms to

```
while (True)
```
</li>

<li>
Constant folding:
Test case #4

```
b = 1/0
```
This will not get constant folded due to divide by zero error.
</li>

Constant folding:
Test case #5

```
a: Rat = None
b: Rat = None

print(a is b)
```
transforms to

```
a: Rat = None
b: Rat = None

print(True)
```
</li>

<li>
Constant propagation:
Test case #6

```
b = 3 + 6
def f(a):
|  return a + b * 3
```
transforms to 

```
b = 9 // from folding
def f(a):
|  return a + 27 // prpagation and folding 
```
</li>
<li>
Constant propagation:
Test case #7

```
a = 4 + 6
if False:
|  a = 3

if 2 == 2:
|  x = a + 3
```
This will not get transformed in the current iteration of constant propagation.
</li>
<li>
Constant propagation:
Test case #8

```
a = 3
while condition:
|  print(a)
```
transforms to

```
a = 3
while condition:
|  print(3)
```
</li>
<li>
Constant propagation:
Test case #9

```
a = 3
if condition:
|  a = 4
|  print(a)

else:
|  a = 5
|  print(a)
```
transforms to

```
a = 3
if condition:
|  a = 4
|  print(4)

else:
|  a = 5
|  print(5)
```
</li>

<li>
Constant propagation:
Test case #10

```
a = 3
def f(b):
|  b = a

a = 5
f(2)

a = 7
f(3)
```
This will not get transformed in the current iteration of constant propagation.
</li>
</ul>

## List of changes to AST/IR

We will not be making any changes to the IR/AST. We will need to take in changes to these from all teams.
Our work will be to just update IR statements values and (or) annotations and also to reduce them.

## Description of files/functions/datatypes to be added/ added

A description of any new functions, datatypes, and/or files added to the codebase. 
These can be actual code diffs in the PR or written in your design.md.
<ol>
    <li>optimization.ts - Contains all the optimization functionalities. Currently implemented - constant propagation within the same scope, constant folding.
    </li>
    <ul>
        <li>Datatypes : 
        <ul>
            <li>Env - An environment type that contains a map from variables to their compile time value (compileVal).
            </li>
            <li> compileVal - A compile time value type that extends type 'Value' from ir.ts to include types "nac" (Not a Constant) and "undef" (Undefined). These add-ons are used to resolve merge conflicts during constant propagation.
            </li>
        </ul>
        </li>
        <li>Functions (only the important ones are listed here) :  
            <ul>
                <li>optimizeProgram() - Maps a source program IR to an optimized program IR. Optimization is done in multiple passes and ends when the IR stabilizes. Currently - Each basic block contains in-environments (Env). In-environments are used for constant propagation within the basic block and are updated accordingly. To be implemented - Dead code elimination.
                </li>
                <li>optimizeFunction() - Maps a function's IR to an optimized function's IR. Operates identically to optimizeProgram().
                </li>
                <li>computeInitEnv() - Computes the in-environment to the first basic block consisting of all vardefs mapped to type "undef". 
                </li>
                <li>mergeAllPreds() - A helper function for the worklist algorithm that merges the out-environments of all predecessor basic blocks.
                </li>
                <li> generateEnvironments() - A recursive forward-pass worklist algorithm that computes a stable set of in-environments for all basic-blocks.
                </li>
            </ul>
        </li>
    </ul>
    <li>optimization_utils.ts - Contains utility functions required for optimization; mainly includes type equality checks and deep equality checks on IRs to decide the termination of our multiple-pass optimization algorithm.
    </li>
    <li>optimizations.test.ts - Contains optimization test cases. Current tests are sanity checks which compare the IRs and outputs of the source and optimized programs.
    </li>
    <li>Function assertOptimize() in asserts.test.ts - Function for testing.
    </li>
</ol>
## Description of memory layout or value representation

A description of the value representation and memory layout for any new runtime 
values you will add. These should be described in design.md rather than implemented 
directly.


## Next steps
Currently, we have implemented all features (constant propagation and folding which was described in the first week milestone).

We will try and implement the following features by the next milestone:
- Dead code elimination
- Copy Propagation
- Structured control flow
- Adding string/list support to constant folding and propagation