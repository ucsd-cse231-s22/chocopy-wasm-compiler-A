import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { addLibs } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
  a: int = 10
b: int = 20
c: bool = True
print(a if c else b)
print(a if not c else b)`
  // var source = `
  // class C(object):
  //   def __init__(self:C, other:D):
  //     pass
  
  // x:C = None
  // x = C()`
const ast = parse(source);
// console.log(ast);
  const repl = new BasicREPL(await addLibs());
  const result = repl.run(source, "1").then(result => {
    console.log(result);    
  })  
}

debug();

