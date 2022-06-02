import {
  assertPrint,
  assertFail,
  assertTCFail,
  assertTC,
  assert,
  assertClose,
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

describe("[builtins]: simple import", () => {
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

describe("[builtins]: random library", () => {
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

describe("[builtins]: bigint math library", () => {
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

describe("[builtins]: float math library", () => {
  // ceil
  assertPrint("fmath-ceil", `from float_math import ceil
  print(ceil(1.5))`, ["2"]);
  // floor
  assertPrint("fmath-floor", `from float_math import floor
  print(floor(1.5))`, ["1"]);
  // round
  assertPrint("fmath-round", `from float_math import round
  print(round(1.5))`, ["2"]);
  // exp
  assertClose("fmath-exp", `from float_math import exp
  print(exp(1.5))`, "4.4816890703380645");
  // log
  assertClose("fmath-log", `from float_math import log
  print(log(1.5, 2.0))`, "0.5849625007211562");
  // log10
  assertClose("fmath-log10", `from float_math import log10
  print(log10(1.5))`, "0.17609125905568124");
  // sqrt
  assertClose("fmath-sqrt", `from float_math import sqrt
  print(sqrt(1.5))`, "1.2599210498948732");
  // sin
  assertClose("fmath-sin", `from float_math import sin
  print(sin(1.5))`, "0.84147098480789650");
  // cos
  assertClose("fmath-cos", `from float_math import cos
  print(cos(1.5))`, "0.54030230586813982");
  // tan
  assertClose("fmath-tan", `from float_math import tan
  print(tan(1.5))`, "1.5574077246549023");
});

describe("[builtins]: function definition store", () => {
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
