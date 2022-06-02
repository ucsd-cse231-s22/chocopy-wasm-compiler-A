import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { addLibs } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
  def f(x: int) -> int:
    1+1
    1+1
    return x + 10
  def q(x: int) -> int:
    return x - 10
  def z() -> bool:
    return True
l : int = 0
l = f(10) if z() else q(10)
print(l)`
  // var source = `
  // class C(object):
  //   def __init__(self:C, other:D):
  //     pass
  
  // x:C = None
  // x = C()`
const ast = parse(source);
// console.log(ast);
  const repl = new BasicREPL(await addLibs());
  const result = repl.run(source, "4").then(result => {
    console.log(result);    
  })  
}

debug();

