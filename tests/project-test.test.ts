import { assertPrint, assertTCFail, assertTC, assertFail } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

export function test_print(n: bigint) {
    assertPrint("1_test_print", `print(${n})`, [`${n}`]);
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
        `x : int = ${x}
        y : int = ${y}
        print(y ${op} x)`, 
        [`${res}`]);
}

export function test_uniop(des: string, x: bigint, op: string, res: string) {
    assertPrint(des, 
        `x : int = ${x}
        print(${op}x)`, 
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

describe("Project test cases", () => {
    test_print(BigInt(100000000000000000000000));
    test_init_assign(BigInt(0), BigInt(10), BigInt(100000000000000000000000));
    test_binop("3_test_greater_than", BigInt(100000000000000000000000), BigInt(100000000000000000000001), ">", "True");
    test_binop("4_test_less_than", BigInt(100000000000000000000000), BigInt(100000000000000000000001), "<", "False");
    test_binop("5_test_greater_equal", BigInt(100000000000000000000000), BigInt(100000000000000000000001), ">=", "True");
    test_binop("6_test_less_equal", BigInt(100000000000000000000000), BigInt(100000000000000000000001), "<=", "False");
    test_binop("7_test_equal", BigInt(100000000000000000000000), BigInt(100000000000000000000000), "==", "True");
    test_binop("8_test_not_equal", BigInt(100000000000000000000000), BigInt(100000000000000000000001), "!=", "True");
    test_uniop("9_test_negate", BigInt(10000000000000000000000), "-", "-10000000000000000000000");
    test_param_return("10_test_param_return", BigInt(10000000000000000000000), BigInt(0), "10000000000000000000000");
});