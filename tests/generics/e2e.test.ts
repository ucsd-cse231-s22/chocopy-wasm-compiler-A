import { expect } from 'chai';
import { assertTCFail, assertPrint } from '../asserts.test';
import {typeCheck} from "../helpers.test";

describe('e2e tests to check generics', () => {
    const prog0 = `
    L = TypeVar('L')
    R = TypeVar('R')

    class Pair(Generic[L, R]):
        left: L = __ZERO__
        right: R = __ZERO__

    p1 : Pair[int, int] = None
    p2 : Pair[int, bool] = None
    p1 = Pair()
    p1.left = 10
    p1.right = 20
    p2 = Pair()

    print(p1.left)
    print(p1.right)
    print(p2.left)
    print(p2.right)
    `
    assertPrint('Basic Generic class with two typevars', prog0, ["10", "20", "0", "False"]);

    const prog1 = `
    T = TypeVar('T')
    class Rat():
        a: int = 20
    class Box(Generic[T]):
        f : T = __ZERO__
        a : Box[T] = None
        def getF(self: Box[T]) -> T:
            return self.f
        def setF(self: Box[T], f: T):
            self.f = f
    b2: Box[Rat] = None
    b2 = Box()
    b2.f = Rat()
    b2.a = Box()
    b2.a.f = Rat()
    print(b2.a.f.a)
    b2.a.f.a = 100
    print(b2.a.f.a)
    `
    assertPrint('Generic class Box with class as typeVar', prog1, ["20", "100"]);

    const prog2 = `
    class C():
        a: int = 20
        def getA(self : C) -> int:
            return self.a

    class B(Generic[U]):
        a : U = __ZERO__
    
    class A(Generic[T, U]):
        a : T = __ZERO__
        b : U = __ZERO__

    T = TypeVar('T')
    U = TypeVar('U')

    a1 : A[int, B[bool]] = None
    a2 : A[C, B[C]] = None
    a1 = A()
    a2 = A()
    print(a1.a)
    a1.b = B()
    print(a1.b.a)
    a1.b.a = 1 < 2
    print(a1.b.a)

    a2.a = C()
    a2.b = B()
    a2.b.a = C()
    print(a2.a.getA())
    print(a2.a.a)
    print(a2.b.a.getA())
    print(a2.b.a.a)
    `
    assertPrint('Generic class with typeVar as another Generic class', prog2, ["0", "False", "True", "20", "20", "20", "20"]);

    const prog3 = `
    T = TypeVar('T')
    class C(Generic[T]):
        t: T = __ZERO__
        def f(self: C[T], other: C[T]):
            self.t = other.t

    c1 : C[int] = None
    c2 : C[int] = None
    c1 = C()
    c2 = C()
    print(c1.t)
    c2.t = 10
    c1.f(c2)
    print(c1.t)
    `
    assertPrint('Joe\'s blessed test case from class', prog3, ["0", "10"]);

    const prog4 = `
    L = TypeVar('L')
    R = TypeVar('R')

    class Pair(Generic[L, R]):
        left: L = __ZERO__
        right: R = __ZERO__

        def createNewPairWithSwappedArguments(self: Pair[L, R]) -> Pair[R, L]:
            p1 : Pair[R, L] = None
            p1 = Pair()
            p1.right = self.left
            p1.left = self.right
            return p1

    p1 : Pair[int, bool] = None
    p2 : Pair[bool, int] = None

    p1 = Pair()
    p1.left = 10
    p1.right = True

    p2 = p1.createNewPairWithSwappedArguments()

    print(p1.left)
    print(p1.right)
    print(p2.left)
    print(p2.right)
    `

    assertPrint('Generic Pair class with swap function', prog4, ["10", "True", "True", "10"]);

    const prog5 = `
    T = TypeVar('T')

    class Node(Generic[T]):
      value: T = __ZERO__
      next: Node[T] = None

    class LinkedList(Generic[T]):
      head: Node[T] = None

      def push(self: LinkedList[T], value: T):
        node: Node[T] = None
        
        node = Node()
        node.value = value
        if not (self.head is None):
          node.next = self.head
        self.head = node

      def pop(self: LinkedList[T]) -> Node[T]:
        node: Node[T] = None
        if self.head is None:
          return None
        else:
          pass

        node = self.head
        self.head = self.head.next
        return node

    l : LinkedList[int] = None
    l = LinkedList()
    l.push(10)
    l.push(20)
    l.push(30)
    l.push(40)
    l.pop()

    print(l.head.value)
    print(l.head.next.value)
    `
    assertPrint('Generic Linked List test - 0', prog5, ["30", "20"]);

    const prog6 = `
    T = TypeVar('T')

    class Box(Generic[T]):
      v: T = __ZERO__

      def map(self: Box[T], f: Callable[[T], T]):
        self.v = f(self.v)

    b: Box[int] = None
    b = Box()
    b.v = 10
    print(b.v)
    b.map(mklambda(Callable[[int], int], lambda a: a+2))
    print(b.v)
    `

    assertPrint('Generic Box with lambda map - 0', prog6, ["10", "12"]);

    const prog7 = `
    T = TypeVar('T')

    class Box(Generic[T]):
      v: T = __ZERO__

      def map(self: Box[T], f: Callable[[T], T]) -> Box[T]:
        b : Box[T] = None
        b = Box()

        b.v = f(self.v)
        return b

    b1 : Box[int] = None
    b1 = Box()
    print(b1.v)
    print(b1.map(mklambda(Callable[[int], int], lambda a: a + 2)).v)
    print(b1.map(mklambda(Callable[[int], int], lambda a: (a + 1) * 10)).v)
    print(b1.v)
    `

    assertPrint('Generic Box with lambda map - 1', prog7, ["0", "2", "10", "0"]);

    const prog8 = `
    T = TypeVar('T')

    class Box(Generic[T]):
      a: T = __ZERO__

    def genericFunc(a: int, x: T, y: Box[T]) -> T :
      y.a = x
      return y.a

    b1 : Box[int] = None  
    b1 = Box()
    print(b1.a)
    print(genericFunc(2, 3, b1))
    print(b1.a)
    `
    assertPrint('Generic function', prog8, ["0", "3", "3"]);

    const prog9 = `
    T = TypeVar('T')

    class Box(Generic[T]):
      a: T = __ZERO__
      
      def callGenFunc(self: Box[T]) -> T:
        b2 : Box[int] = None
        b2 = Box()
        return genericFunc(3, 4, b2)

    def genericFunc(a: int, x: T, y: Box[T]) -> T :
      y.a = x
      return y.a

    b1 : Box[int] = None  
    b1 = Box()
    print(b1.callGenFunc())
    print(b1.a)
    `
    assertPrint('Generic function used inside Generic class', prog9, ["4", "0"]);

    const prog10 = `
    T = TypeVar('T')

    def f(x: int) -> int:
      return x + 2

    def g(y: Callable[[T], T]) -> T:
      return y(4)

    print(g(f))
    `
    assertPrint('Generics with closures', prog10, ["6"]);


    const prog11 = `
    T = TypeVar('T')

    class SuperBox(Generic[T]):
      sv: T = __ZERO__ 

    class Box(Generic[T], SuperBox[T]):
      v: T = __ZERO__


    b : Box[int] = None
    b = Box()
    b.sv = 1000
    print(b.sv)
    b.v = 50
    print(b.v)
    `
    assertPrint('Generic superclass field access - 0', prog11, ["1000", "50"]);

    const prog12 = `
    T = TypeVar('T')
    U = TypeVar('U')

    class SuperBox(Generic[T, U]):
      sv1: T = __ZERO__ 
      sv2: U = __ZERO__ 

    class Box(Generic[T, U], SuperBox[U, T]):
      v: T = __ZERO__


    b : Box[int, bool] = None
    b = Box()
    b.sv1 = True
    b.sv2 = 1000
    print(b.sv2)
    print(b.sv1)
    b.v = 50
    print(b.v)
    `
    assertPrint('Generic superclass field access - 1', prog12, ["1000", "True", "50"]);

    const prog13= `
    T = TypeVar('T')
    U = TypeVar('U')
    V = TypeVar('V')

    class SuperSuperBox(Generic[V]):
      ssv: V = __ZERO__

    class SuperBox(Generic[T, V], SuperSuperBox[V]):
      sv: T = __ZERO__ 

    class Box(Generic[T, U, V], SuperBox[U, T]):
      v: T = __ZERO__


    b : Box[int, bool, bool] = None
    b = Box()
    print(b.ssv)
    print(b.sv)
    print(b.v)
    `
    assertPrint('Generic superclass field access - 2', prog13, ["0", "False", "0"]);

    const prog14 = `
    T = TypeVar('T')
    U = TypeVar('U')

    class SuperBox(Generic[T, U]):
      sv1: T = __ZERO__ 
      sv2: U = __ZERO__ 

    class Box(Generic[T], SuperBox[bool, T]):
      v: T = __ZERO__

    b : Box[int] = None
    b = Box()
    b.sv1 = True
    b.sv2 = 1000
    print(b.sv2)
    print(b.sv1)
    b.v = 50
    print(b.v)
    `
    assertPrint('Generic superclass field access - 3', prog14, ["1000", "True", "50"]);

    const prog15 = `
    T = TypeVar('T')

    class Iterator(Generic[T]):
      v : T = __ZERO__
      def hasnext(self: Iterator[T]) -> bool:
        1 // 0
        return False
      
      def next(self: Iterator[T]) -> T:
        1 // 0
        return self.v

      def reset(self: Iterator[T]):
        1 // 0     

    class Range(Generic[T], Iterator[int]):
      min: int = 0
      max: int = 0
      current: int = 0

      def new(self: Range[T], min: int, max: int):
        self.min = min
        self.max = max
        self.current = self.min

      def hasnext(self: Range[T]) -> bool:
        return self.current < self.max

      def next(self: Range[T]) -> int:
        v: int = 0
        v = self.current
        self.current = self.current + 1
        return v

      def reset(self: Range[T]):
        self.current = self.min

    i : int = 0
    r : Range[int] = None
    r = Range()
    r.new(0, 5)

    for i in r:
      print(i)
    `
    assertPrint('Generic iterator interface - 0', prog15, ["0", "1", "2", "3", "4"]);

    const prog16 = `
    T = TypeVar('T')

    class Iterator(Generic[T]):
      v : T = __ZERO__
      def hasnext(self: Iterator[T]) -> bool:
        1 // 0
        return False
      
      def next(self: Iterator[T]) -> T:
        1 // 0
        return self.v

      def reset(self: Iterator[T]):
        1 // 0     

      def map(self: Iterator[T], f: Callable[[T], T]) -> MapIterator[T]:
        iter : MapIterator[T] = None
        iter = MapIterator()
        return iter.new(self, f)

    class MapIterator(Generic[T], Iterator[T]):
      iter: Iterator[T] = None
      f: Callable[[T], T] = None

      def new(self: MapIterator[T], iter: Iterator[T], f: Callable[[T], T]):
        self.iter = iter
        self.f = f

      def hasnext(self: MapIterator[T]) -> bool:
        return self.iter.hasnext()

      def next(self: MapIterator[T]) -> T:
        f : Callable[[T], T] = None
        f = self.f
        return f(self.iter.next())

      def reset(self: MapIterator[T]):
        self.iter.reset()

    class Range(Generic[T], Iterator[int]):
      min: int = 0
      max: int = 0
      current: int = 0

      def new(self: Range[T], min: int, max: int):
        self.min = min
        self.max = max
        self.current = self.min

      def hasnext(self: Range[T]) -> bool:
        return self.current < self.max

      def next(self: Range[T]) -> int:
        v: int = 0
        v = self.current
        self.current = self.current + 1
        return v

      def reset(self: Range[T]):
        self.current = self.min

    f : Callable[[int], int] = None
    i : int = 0
    r : Range[int] = None
    it : Iterator[int] = None
    r = Range()
    r.new(0, 5)

    f = mklambda(Callable[[int], int], lambda x: x * 10)
    it = r.map(f)

    for i in it:
      print(i)
    `
    assertPrint('Generic iterator interface - 1', prog16, ["0", "1", "2", "3", "4"]);
})
