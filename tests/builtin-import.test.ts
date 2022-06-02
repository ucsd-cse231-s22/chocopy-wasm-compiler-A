import {
  assertPrint,
  assertFail,
  assertTCFail,
  assertTC,
  assert,
} from "./asserts.test";
import { addLibs, importObject } from "./import-object.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test";
import {
  isBuiltin,
  isBuiltinNumArgs as is_builtin_with_args,
} from "../builtins";
import * as chai from "chai";
import { run, typeCheck } from "./helpers.test";

export function assert_eq(name: string, a: any, b: any) {
  it(name, async () => {
    chai.expect(a).to.deep.eq(b);
  });
}

describe("builtin tests: simple import", () => {
  // import / math
  assertTC("import-x-from-y", `from y import x`, NONE);
  assertTC("import-x", `import x`, NONE);

  assertTCFail("use-gcd-without-import", `gcd(1, 2)`);
  assertPrint(
    "use-gcd-with-import",
    `from math import gcd
  print(gcd(6, 9))`,
    ["3"]
  );
});

describe("builtin tests: random library", () => {
  // import / random
  assertTCFail("use-randint-without-import", `randint(1, 100)`);
  assertTC(
    "use-randint-with-import",
    `from random import randint
  randint(1, 1000000)`,
    NUM
  );
  assertTCFail("use-randrange-without-import", `randrange(20)`);
  assertTC(
    "use-randrange-with-import",
    `from random import randrange
  randrange(100)`,
    NUM
  );

  // random correctness
  it("random-correctness", async () => {
    await run(`from random import randint
    print(randint(1, 100))`);
    const output = importObject.output.trim().split("\n");
    chai.expect(output.length).to.eq(1);
    chai.expect(Number(output[0])).to.lessThanOrEqual(100);
    chai.expect(Number(output[0])).to.greaterThanOrEqual(1);
  });
});

describe("builtin tests: math int function behavior", () => {
  assertPrint(
    "math-comb",
    `from math import comb
  print(comb(8,2))`,
    ["28"]
  );
  assertPrint(
    "math-comb-bignum",
    `from math import comb
  print(comb(100,25))`,
    ["242519269720337121015504"]
  );
  assertPrint(
    "math-perm",
    `from math import perm
  print(perm(8,2))`,
    ["56"]
  );
  assertPrint(
    "math-perm-bignum",
    `from math import perm
  print(perm(100,25))`,
    ["3761767332187389431968739190317715670695936000000"]
  );
  assertPrint(
    "use-gcd-with-bignum",
    `from math import gcd
  print(gcd(1238476981736498572634, 1857715472604747858951))`,
    ["619238490868249286317"]
  );
  assertPrint(
    "use-lcm-with-bignum",
    `from math import lcm
  print(lcm(1238476981736498572634, 1857715472604747858951))`,
    ["3715430945209495717902"]
  );
  assertPrint(
    "use-factorial-with-bignum",
    `from math import factorial
  print(factorial(100))`,
    [
      "93326215443944152681699238856266700490715968264381621468592963895217599993229915608941463976156518286253697920827223758251185210916864000000000000000000000000",
    ]
  );
});

describe("builtin test: function definition store", () => {
  assert_eq("builtin-has-gcd", isBuiltin("gcd"), true);
  assert_eq("builtin-has-lcm", isBuiltin("lcm"), true);
  assert_eq("builtin-has-factorial", isBuiltin("factorial"), true);
  assert_eq("builtin-has-gcd-with-args", is_builtin_with_args("gcd", 2), true);
  assert_eq("builtin-has-lcm-with-args", is_builtin_with_args("lcm", 2), true);
  assert_eq(
    "builtin-has-factorial-with-args",
    is_builtin_with_args("factorial", 1),
    true
  );
  assert_eq("builtin-has-not-asdfasdf", isBuiltin("asdfasdf"), false);
});
