import {
  assertPrint,
  assertFail,
  assertTCFail,
  assertTC,
  assert,
} from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test";
import {
  isBuiltin,
  isBuiltinNumArgs as is_builtin_with_args,
} from "../builtins";
import * as chai from "chai";

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
  assertPrint(
    "use-gcd-with-bignum",
    `from math import gcd
  print(gcd(1238476981736498572634, 1857715472604747858951))`,
    ["619238490868249286317"]
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