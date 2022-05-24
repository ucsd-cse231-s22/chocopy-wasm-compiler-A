# **Project: Milestone Update Week 9 (Chocopy)**
### Naga Siva Subramanyam Makam, Laxminarasimha Saketh Khandavalli
---
**1) Which features had interactions that you didn’t expect before you started implementing?**
- Strings and for loops were the two features that had unexpected interactions. This is because the iterator type for iterating over strings is also a `string` type. For example in the below program instead of treating a string as a list of characters, each character must be mapped to a string of length 1.
```
s:str = "abc"
iter:str = ""
for iter in s:
   print(iter)
```
This was unexpected because we thought that strings are nothing but a list of characters. Another interesting case displaying this property:
```
s:str = "abc"
t:str = ""
t = s[0]
```
Here we should treat `s[0]` again as a `string` instead of a `character`.

---

**2) What feature are you most proud of in your implementation and why?**
- Nested functions was the feature we worked very hard on and hence are proud of. The implementation was a bit tricky as we had to add a new step to transform the current code for adding and passing references of `var-inits` and `params`, for accessibility in child functions. For example the below program needs to be converted as shown:

***Original code***
```
def f():
    y:int = 0

    def g():
      nonlocal y
      y = 5

    g()
    print(y)
```

***Converted code***
```
class RefClass(object):
  value:int = 0

def f():
    y:int = 0
    ref1:RefClass = None
    ref1 = RefClass()
    ref1.value = y
    f$g(ref1)
    print(ref1.value)

def f$g(ref1: RefClass):
    ref1.value = 5
```

---

**3) What features remain to implement?**
- In this week, we implemented nested functions, conditional expressions, support for elif statements and all the features of inheritance except for virtual functions.
- We added many testcases for all the implemented features and also included the interesting cases (described in last weeks design.md) that were failing last week. These can be tested using the command `npm test`. All the newly added testcases are in `milestone1.test.ts`.
- This week we plan to add support for virtual functions, proper error handling messages and do a thorough testing with comprehensive testcases.

---

**4) Is there anything you’re stuck on?**
- We were stuck on nested functions for a while, but were able to resolve the issues and implement it successfully.

---

**5) Consider programs that work in Python, but not in ChocoPy, involving strings or lists. Pick one that you think would be a straightforward extension to your compiler – describe how you would implement it. Pick one that you think would be an extremely difficult extension to your compiler – describe why.**

a) One of the straightforward extensions to our compiler is Lists/Strings slicing. For example the below program after slicing should print `cd`.
```
a:str = "abcdef"
b:str = ""
b = a[2:4]
print(b)
```
To implement this feature we need to add a new type of `Expr` type to the AST as follows:

```{  a?: A, tag: "slice", object: Expr<A>, start: Expr<A>, end: Expr<A> }```
- The expression `a[2:4]` must be parsed into the above `Expr` object. 
- In the typechecking stage, we need to make sure that `object` is of type either `string` or `list` and also `start` and `end` expressions should be of type `int`.
- In the IR stage, we need to flatten the `object`, `start` and `end` into `Value<A>` types by using `flattenExprToVal`. The IR stage will return an `Expr` as shown below:
```{  a?: A, tag: "slice", object: Value<A>, start: Value<A>, end: Value<A> }```
- In the codegen stage, we assert that the left and right values are inside bounds and make sure that the object is not None. If the slice passes all these checks we allocate the required memory and store the corresponding values. We then return the starting address of the newly created string/list.

b) We think memory management would be a difficult extension to the compiler because it would involve changing the design a lot. We would need to incorporate new data structures to support memory management algorithms (garbage collection, memory allocation techniques etc). For example: To understand if a memory location can be freed we need to track how many objects are referring to it currently.
