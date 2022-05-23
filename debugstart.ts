import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
class A(object):
    x : int = 1
    def fa(self: A) -> int:
        return 1

class B(A):
    y : int = 1
    def fb(self: B) -> int:
        return 2

b : B = None 
b = B()
print(b.fa())
print(b.fb())
`
//   var source = `
// def f() -> int:
//   x : int = 0
//   for x in [1, 2, 3, 4, 5]:
//     if x > 2:
//       return x
//     else:
//       pass
//   return x
// print(f())
// `
  var source2 = `
x : int = 0
y : int = 1
for x in [1,2,3,4,5]:
  y = y*x
print(y)
  `
// a comprehensive test that tests all features of list
// 1. list assignment(entries can be expr)
// 2. list index(index can be expr)
// 3. lists concat
  var list_comprehensive_test = 
`
a:[int] = None
b:[int] = None
c:[int] = None

a = [1,3,4-3,7,9]
b = [2,4,6,8,10]
print(a[2])
a[2] = 5
c = a+b
print(c[2*3+1]) `

  const ast = parse(source);
  
  const repl = new BasicREPL(await addLibs());
  const result = repl.run(source).then(result => {
    console.log(result);    
  })  
}

debug();

