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
    T = TypeVar('T', A, B)

    class A():
      x: int = 0

    class B():
      x: bool = False

    class Cmp(Generic[T]):
      v: T = __ZERO__

      def cmp(self: Cmp[T], other: Cmp[T]) -> bool:
        return self.v.x == other.v.x

    o1: Cmp[A] = None
    o2: Cmp[A] = None
    
    o3: Cmp[B] = None
    o4: Cmp[B] = None

    o1 = Cmp()
    o1.v = A()
    
    o2 = Cmp()
    o2.v = A()

    o3 = Cmp()
    o3.v = B()

    o4 = Cmp()
    o4.v = B()

    print(o1.cmp(o2))

    o2.v.x = 5
    print(o1.cmp(o2))

    o4.v.x = not o4.v.x
    print(o3.cmp(o4))
    `

    assertPrint('Generic field access', prog4, ["True", "False", "False"]);

    const prog5 = `
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

    assertPrint('Generic Pair class with swap function', prog5, ["10", "True", "True", "10"]);
})
