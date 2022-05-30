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
})
