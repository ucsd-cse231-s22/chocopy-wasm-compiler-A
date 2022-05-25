import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
  T = TypeVar('T')
  class Box(Generic[T]):
    x: T = __ZERO__
  b1 : Box[int] = None
  b1 = Box()
  b1.x = 10
  print(b1.x)
  `
  const ast = parse(source);
  
  const repl = new BasicREPL(await addLibs());
  const result = repl.run(source).then(result => {
    console.log(result);    
  })  
}

debug();

