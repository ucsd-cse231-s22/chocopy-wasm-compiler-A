import { assertPrint, assertTC, assertTCFail } from "./asserts.test";
import {
  BOOL, CALLABLE, NUM,
} from "./helpers.test";

describe("typeCheck(c, s) function", () => {
  assertTC(
    "heck",
    `
    a: Callable[[int, bool], int] = None
    a = mklambda(Callable[[int, bool], int], lambda b, c: print(b))
    a`,
    CALLABLE([NUM, BOOL], NUM)
  );
});

describe("lower", () => {
  assertPrint(
    "lambda print",
    "mklambda(Callable[[], int], lambda: print(5))()",
    ["5"]
  );
  assertPrint(
    "lambda reassign",
    `
    a: Callable[[], int] = None
    a = mklambda(Callable[[], int], lambda: print(5))
    a()
    a = mklambda(Callable[[], int], lambda: print(7))
    a()`,
    ["5", "7"]
  );
  assertPrint(
    "nested lambda",
    `
    mklambda(Callable[[], Callable[[], int]], lambda: mklambda(Callable[[], int], lambda: print(5)))()()`,
    ["5"]
  );
  assertPrint(
    "if lambda",
    `
if mklambda(Callable[[], bool], lambda: True)():
  print(5)
else:
  print(6)`,
    ["5"]
  );

  assertTCFail(
    "first class func",
    `
    def a(b: int, c: int) -> bool:
      print(b)
      print(c)
      return False
    f: Callable[[int, bool], bool] = None
    f = a
    f(4, True)`
  );

  assertTCFail(
    "lambda bad args",
    `
      def a(b: int, c: bool) -> bool:
        print(b)
        print(c)
        return False
      f: Callable[[int, bool], bool] = None
      f = a
      f(4, 9)
      `
  );
});
