import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
class C(object):
  def f(self: C) -> int:
    if True:
      return 0
    else:
      return`
  // var source = `
  // class C(object):
  //   def __init__(self:C, other:D):
  //     pass
  
  // x:C = None
  // x = C()`
const ast = parse(source);
// console.log(ast);
  
  const repl = new BasicREPL(await addLibs());
  const result = repl.run(source).then(result => {
    console.log(result);    
  })  
}

debug();
<<<<<<< HEAD
=======


>>>>>>> bd167027
