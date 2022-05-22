# Generics potential conflicts

## Inheritance

### Changes to the type `Class` in the AST/Parser

The inheritance team needs to be cognizant of how the syntax of Generics looks like in a program, since their changes to the parser
- need to make sure to ignore the declaration of Generics while trying to parse super class fields.
- We have decided to support inheritance in classes from generic classes which would also involve a change in the way super
  classes are represented right now. Instead of `super: Array<string>`, we would need somethig like `super: Array<string, Array<string>>`
  to store the type parameters associated with a generic class.

  A simple example that won't work right now:
  ```python
  T = TypeVar('T')

  class A():
      a: int = 0

  class Box(Generic[T], A):
      x : T = __ZERO__
  ```

### Changes to type-check

- Changes to `isSubClass`, `isAssignable` to support type parameters
- 

---

## First-class functions, Closures

### Changes to the Parser

- There would be conflicts in the `traverseType` function, nothing severe. It's as simple as keeping changes from both of our PRs

### Changes to type-check
- Potential conflicts in the `isSubtype`, `isAssignable` functions but can be resolved by keeping both changes.

**Note** : There would be potential conflict in the next Milestone when we will support generic functions.

---

## Error-Reporting

Nothing in common

---

## Set, Dict, Tuple

### Changes to type-check

- Changes to `equalSet`. Type checking of `Type` should be done some abstract function instead of comparing tags. Specifically, 
  checking equivalence of class types with generics and inheritance would be an issue.

- Similar comment for `equalType`. Just need to make sure this works as expected when doing actual type checking of set elements for generic class types.

---

## For loops, iterators

Nothing in common (check this once!)

---

## Fancy calling conventions

Nothing in common

---

## Front-end

---

## Memory Management

Nothing in common

---

## Bignums

Nothing in common

---

## Testing

Nothing in common

---

## I/O

### Changes in `FileTypeCheck.ts`

- `addFileBuildinClass` : creating class type should be done using the util method `CLASS` since we have added parameters to the class `Type`.

