import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
  T = TypeVar('T')

  class Box(Generic[T]):
      f : T = __ZERO__

      def getF(self: Box[T]) -> T:
          return self.f

      def setF(self: Box[T], f: T):
          self.f = f

  b : Box[int] = None
  b = Box()`
  const ast = parse(source);

  const util = require('util')
  console.log(util.inspect(ast, false, null, true /* enable colors */)) 
  
  const repl = new BasicREPL(await addLibs());
  const result = repl.run(source).then(result => {
    console.log(result);    
  })  
}

debug();

