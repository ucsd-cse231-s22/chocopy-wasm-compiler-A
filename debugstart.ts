import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";
import {emptyGlobalTypeEnv, tc} from "./type-check"

// entry point for debugging
async function debug() {
  var source =   
  `
  def f(x:int, y:int = 5, z:int = True):
    print(x)
    print(y)
    print(z)
  `
  const ast = parse(source);
  const tx_res = tc(emptyGlobalTypeEnv(), ast)
  const repl = new BasicREPL(await addLibs());
  const result = repl.run(source).then(result => {
    console.log(result);    
  })  
}

debug();

