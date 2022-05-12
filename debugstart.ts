import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
a:[int] = None
b:[int] = None
c:[int] = None

a = [1,3,4,7,9]
b = [2,4,6,8,10]
a[2] = 5
c = a+b
print(c[6])
`
// a comprehensive test that test all features of list
// 1. list assignment(entries can be expr)
// 2. list index(index can be expr)
// 3. lists concat
  var comprehensivetest = 
`
a:[int] = None
b:[int] = None
c:[int] = None

a = [1,3,4-3,7,9]
b = [2,4,6,8,10]
print(a[2])
a[2] = 5
c = a+b
print(c[2*3+1])`
  const ast = parse(source);
  
  const repl = new BasicREPL(await addLibs());
  const result = repl.run(source).then(result => {
    console.log(result);    
  })  
}

debug();

