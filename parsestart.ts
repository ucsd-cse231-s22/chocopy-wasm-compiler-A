import { parse } from "./parser";

// var result = parse(`
// def f(x : int):
//     y : int = 0
//     y = y + 2
//     return x + y

// x : int = 0

// y : bool = True

// x = 2

// x = x + x`);

// var result = parse(`
// x : int = 0
// x = x + 2
// `);

var result = parse(`
a: [int] = None
x : int = 0
a = [1,2,3]
a[1] = 4

[1, 2, 3][x]
`);

console.log(JSON.stringify(result, null, 4));
