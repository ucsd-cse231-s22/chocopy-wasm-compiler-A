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

From the previous milestone, we have now implemented constant propagation, folding, copy propagation and dead variable anaylsis. We have also implemented dead code elimination, however right now we are facing certain issues in getting it compatible with closures.

We have also restructured the code a bit, to move all of the major functions to the `optimizations/` directory. The worklist algorithm has also been modified to handle multiple optmization analysis. Environment analysis has been moved to a generic class, which can then handle analysis techniques for multiple types of optimization.

## Description of files/functions/datatypes to be added/ added

A description of any new functions, datatypes, and/or files added to the codebase. 
These can be actual code diffs in the PR or written in your design.md.
<ol>
    <li>optimization.ts - Contains major optimizations handlers
    </li>
    <li>optimizations/* :
        <li>
            Algorithm for various analysis techniques - constant propagation, constant folding, copy propagation, 
            dead code elimination, dead variable analysis.
        </li>
        <li>
            Generic worklist algorithm, environment class for various analysis techniques.
        </li>
    </li>
</ol>
<ol>
    <li>
        Major handlers:
            <ul>
                optimizeProgramBody() - Takes a program IR as input, along with an optimization switch and performs multiple optmimization analysis on the same. Returns an optimized IR
                    * Optimization switch configurations:
                    <ul>
                        <ul>1: Constant propagation and folding</ul>
                        <ul>2: Previous level optimizations and copy propagation</ul>
                        <ul>3: Previous level optimizations and dead variable analysis</ul>
                        <ul>4: Previous level analysis and dead code elimination</ul>
                    </ul>
            </ul>
    </li>
</ol>

<ol>
    Other major files:
    <li>optimization_utils.ts - Contains utility functions required for optimization; mainly includes type equality checks and deep equality checks on IRs to decide the termination of our multiple-pass optimization algorithm.
    </li>
    <li>optimizations.test.ts - Contains optimization test cases. Current tests are sanity checks which compare the IRs and outputs of the source and optimized programs.
    </li>
    <li>Function assertOptimize() in asserts.test.ts - Function for testing.
    </li>
</ol>
## Description of memory layout or value representation

No direct interaction with memory layout. Optimizations performed at IR level.


## Next steps
- To fix dead code elimination, implement structured control flow.