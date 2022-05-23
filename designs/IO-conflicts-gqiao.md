# I/O file team's review to other feature

## Compiler A: Strings

---

\*******************************************
This is the most important feature that our team's feature interacts with.

Please take a close look! Thanks!

\********************************************

## Compiler A: Error reporting

We believe that our IO system will have limited interaction with Error reporting as most of our IOerrors are reported in the Javascript FileSysyem instead of the type-checking process.

## Compiler A: for loops/iterators

We have no interaction with for loops in our current implementation. In the next milestone, methods like readline may use a loop, but we can avoid using for loops at the time. For example, we can use use a while loop and an "if EOF then break" in the implementation,

## Compiler A: Front-end user interface

The implementation is fancy, but the interaction with IO system is limited. We believe the only interaction is that "open" buildin function and "File" buildin object should be added to the keywords.

## Compiler A: Generics and polymorphism

The implementation of Polymorphism and Generics is cool and might be helpful for some buildin functions and classes. But it seems that our open function and File object do not need such features.

## Compiler A: Fancy calling conventions

The implementation gives us an option to add **kwargs in the next step, though most of our parameters of functions are necessary. 
