import { assertPrint, assertTCFail, assertTC, assertFail } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

export function test_print(n: bigint) {
    assertPrint("1_test_print", 
        `print(${n})`, 
        [`${n}`]);
}

export function test_init_assign(x_init: bigint, y_init: bigint, x_val: bigint) {
    assertPrint("2_test_init_assign", 
        `x : int = ${x_init}
        y : int = ${y_init}
        y = x
        print(y)
        x = ${x_val}
        print(x)
        print(y)`,
        [`${x_init}`, `${x_val}`, `${x_init}`]);
}

export function test_binop(des: string, x: bigint, y: bigint, op: string, res: string) {
    assertPrint(des, 
        `def f(x:int, y:int):
            print(x ${op} y)
        f(${x}, ${y})`, 
        [`${res}`]);
}

export function test_uniop(des: string, x: bigint, op: string, res: string) {
    assertPrint(des, 
        `def f(x: int):
            print(${op}x)
        f(${x})`, 
        [`${res}`]);
}

export function test_param_return(des: string, c: bigint, param: bigint, res: string) {
    assertPrint(des, 
        `def f(c:int) -> int:
            c = ${c}
            return c
        print(f(${param}))`, 
        [`${res}`]);
}

export function test_list_len_if(des: string) {
    assertPrint(des, 
        `def f(a : [int]):
        i:int = 0
        if len(a) > 0:
          print(a[0])
        else:
          print(None)
    f([])
    f([-1,-1,-1])`, 
    [`None`, `-1`]);
}

export function test_recursive_builtin(des: string) {
    assertPrint(des, 
        `def gcd(x : int, y : int) -> int:
        if x == 0:
              return abs(y)
        return gcd(y%x, x)
    print(gcd(24,9))
    print(gcd(5,8))
    print(gcd(-4,8))`, 
    [`3`, `1`, `4`]);
}

export function test_list_len(des: string) {
    assertPrint(des, 
        `def f(a : [int]):
        i : int = 0
        while i < len(a) - 1:
            print(a[i + 1])
            i = i + 1
    f([1, 2, 3])`, 
        [`2`, `3`]);
}

export function test_for_loop(des: string) {
    assertPrint(
        des,
        `
        class Range(object):
        current : int = 0
        min : int = 0
        max : int = 0
        def new(self:Range, min:int, max:int)->Range:
          self.min = min
          self.current = min
          self.max = max
          return self
        def next(self:Range)->int:
          c : int = 0
          c = self.current
          self.current = self.current + 1
          return c
        def hasnext(self:Range)->bool:
          return self.current < self.max
        def reset(self:Range) :
          self.current = self.min
      
    def f(a : [int]):
        i : int = 0
        cls : Range = None
        cls = Range().new(0, len(a))
        for i in cls:
            print(a[i] + 1)
    f([1, 2, 3])
        `,
        [`2`, `3`, `4`]
      );
}



describe("Bignums test cases", () => {
    test_print(BigInt("100000000000000000000000"));
    test_init_assign(BigInt(0), BigInt(10), BigInt("100000000000000000000000"));
    test_binop("3_test_greater_than", BigInt("100000000000000000000000"), BigInt("100000000000000000000001"), ">", "False");
    test_binop("4_test_less_than", BigInt("100000000000000000000000"), BigInt("100000000000000000000001"), "<", "True");
    test_binop("5_test_greater_equal", BigInt("100000000000000000000000"), BigInt("100000000000000000000001"), ">=", "False");
    test_binop("6_test_less_equal", BigInt("100000000000000000000000"), BigInt("100000000000000000000001"), "<=", "True");
    test_binop("7_test_less_equal_eq", BigInt("100000000000000000000000"), BigInt("100000000000000000000000"), "<=", "True");
    test_binop("8_test_greater_equal_eq", BigInt("100000000000000000000000"), BigInt("100000000000000000000000"), ">=", "True");
    test_binop("9_test_equal", BigInt("100000000000000000000000"), BigInt("100000000000000000000000"), "==", "True");
    test_binop("10_test_equal_neg", BigInt("-123456789012345678901234567890"), BigInt("-123456789012345678901234567890"), "==", "True");
    test_binop("11_test_equal_neg_fail", BigInt("-2147483648"), BigInt("2147483648"), "==", "False");
    test_binop("12_test_not_equal", BigInt("100000000000000000000000"), BigInt("100000000000000000000001"), "!=", "True");
    test_binop("13_test_not_equal_fail", BigInt("123456789012345678901234567890"), BigInt("123456789012345678901234567890"), "!=", "False");
    test_binop("14_test_mul", BigInt("4294967291"), BigInt("4294967291"), "*", "18446744030759878681");
    test_binop("15_test_mul_neg", BigInt("4294967291"), BigInt("-4294967291"), "*", "-18446744030759878681");
    test_binop("16_test_div", BigInt("42949672910"), BigInt("4294967291"), "//", "10");
    test_binop("17_test_div_neg", BigInt("-42949672910"), BigInt("-4294967291"), "//", "10");
    test_binop("18_test_div_neg_denom", BigInt("42949672910"), BigInt("-4294967291"), "//", "-10");
    test_binop("19_test_div_neg_num", BigInt("-42949672910"), BigInt("4294967291"), "//", "-10");
    test_binop("20_test_add", BigInt("2147483648"), BigInt("40"), "+", "2147483688");
    test_binop("21_test_add_neg", BigInt("2147483648"), BigInt("-2147483648"), "+", "0");
    test_binop("22_test_sub", BigInt("2147483648"), BigInt("2"), "-", "2147483646");
    test_binop("23_test_sub_neg", BigInt("2147483648"), BigInt("-2"), "-", "2147483650");
    test_binop("24_test_neg_sub", BigInt("-2147483648"), BigInt("2"), "-", "-2147483650");
    test_binop("25_test_mod", BigInt("42949672910"), BigInt("4294967290"), "%", "10");
    test_binop("26_test_mod_neg_denom", BigInt("42949672910"), BigInt("-4294967290"), "%", "10");
    test_binop("27_test_mod_neg_num", BigInt("-42949672910"), BigInt("4294967290"), "%", "-10");
    test_uniop("28_test_negate", BigInt("100000000000000000000000"), "-", "-100000000000000000000000");
    test_uniop("29_test_doublenegate", BigInt("-2147483648"), "-", "2147483648");
    test_param_return("30_test_param_return", BigInt("100000000000000000000000"), BigInt(0), "100000000000000000000000");
    test_param_return("31_test_param_return_neg", BigInt("-100000000000000000000000"), BigInt(0), "-100000000000000000000000");
});

describe("Bignums Interaction with Other Feature Testcases", () => {
    test_recursive_builtin("1_test_recursive_builtin");
    test_list_len_if("2_test_list_len_if");
    test_list_len("3_test_list_len_binop_index");
    test_for_loop("4_test_for_loop_list_access");
});
