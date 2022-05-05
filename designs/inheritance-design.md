1. Multilevel Inheritance

class List(object):

  def curval(self: List) -> int:
    return 1/0

class Empty(List):

  def curval(self: Empty) -> int:
    return 0

class Link(List):

  val : int = 0
  next : List = None

  def curval(self: Link) -> int:
    return self.val

  def new(self: Link, val: int, )

l : list = None
l = Link().new(5, Link().new(13, Empty()))


2. Inherit from a class that doesn't exist

3. Methods that do not exist in super class

4. Order of parsing subclasess and superclass (check in chocopy)

5. Methods that do not exist in subclass

6. Order of parsing and storing methods

7. Constructors (sub class & super class)

8. Commutative property between inherited clasess

9. new method for port memory allocation

class Rat(object):
  n : int = 0
  d : int = 0

  def new (self, n: int, d:int) -> Rat:
    self.n = n
    self.d = d
    return self

r : Rat = None
r = Rat().new(1,2)


10. Check for methods that don't exist in both subclass and super class

11. Default constructor

class Rat(object):
  n : int = 0
  d : int = 0

r : Rat = None
r = Rat()

12. Method overridding?