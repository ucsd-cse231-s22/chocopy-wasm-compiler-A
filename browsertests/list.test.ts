import { assertPrint, assertRunTimeFail, assertTCFail, assertRepl } from './browser.test';

describe("List tests", () => {
    // // 1
    // assertTC("create-list", `
    // a: [int] = None
    // a = [1, 2, 3]`, NONE);

    // // 2
    // assertTC("create-list-empty", `
    // a: [int] = None
    // a = []`, NONE);

    // 3
    assertPrint("access-element", `
a: [int] = None
a = [2, 4, 6, 8]
print(a[0])`, [`2`]);

    // 4
    assertRunTimeFail("out-of-bounds", `
a: [int] = None
a = [2, 4, 6, 8]
a[4]`);

    // 5    
    assertRunTimeFail("negative-index", `
a: [int] = None
a = [1, 2, 3]
a[-1]`);

    // 6
    assertPrint("expr-elements", `
a: [int] = None
b: int = 100
a = [1 + 2, b, (-50)]
print(a[0])
print(a[1])
print(a[2])`, [`3`, `100`, `-50`]);

    // 7
    assertPrint("store-element", `
a: [int] = None
a = [1, 2, 3]
a[0] = 5
print(a[0])`, [`5`]);

    // 8
    assertPrint("replace-list-reference", `
a: [int] = None
a = [1, 2, 3]
a = [4, 5, 6, 7, 8, 9]
print(a[4])`, [`8`]);

    // 9
    assertTCFail("assign-wrong-type", `
a: [int] = None
a = [1, 2, 3]
a[2] = True`);

    // // 10
    // assertTC("create-bool-list", `
    // a: [bool] = None
    // a = [True]`, NONE);


    //////// new tests ////////

    assertPrint("list-as-param", `
def f(lst: [int]) -> int:
  return lst[1]
a: [int] = None
a = [66, -5, 10]
print(f(a))`, [`-5`])

    assertTCFail("assign-wrong-list-type", `
a: [bool] = None
a = [-0, -0, -0, -0]`);

    assertPrint("list-of-snek-objects", `
class Snake(obj):
  num_teeth: int = 100

snek1: Snake = None
snek2: Snake = None
snek3: Snake = None
snek_list: [Snake] = None

snek1 = Snake()
snek1.num_teeth = 300
snek2 = Snake()
snek2.num_teeth = 0
snek3 = Snake()
snek_list = [snek1, snek2, snek3]

print(snek_list[0].num_teeth)
print(snek_list[1].num_teeth)
print(snek_list[2].num_teeth)
    `, [`300`, `0`, `100`])

    assertPrint("list-of-objects-has-None", `
class Snake(obj):
  num_teeth: int = 100
snek_list: [Snake] = None
snek_list = [Snake(), None, None]
print(0)
    `, [`0`])

    assertPrint("use-element-in-expr", `
a: [int] = None
a = [1, 2, 4, 8, 16, 32, 64]
print(a[2] + a[5])
    `, [`36`])
});