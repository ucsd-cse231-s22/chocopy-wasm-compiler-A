import { FunDef, Parameter, Program, Type, VarInit } from "./ast";
import { monomorphizeProgram } from "./monomorphizer";
import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { importObject, addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
  T = TypeVar('T', int, bool)

  class Box(Generic[T]):
      f : T = __ZERO__
      a : Box[T] = None

      def getF(self: Box[T]) -> T:
          return self.f

      def setF(self: Box[T], f: T):
          print(self.f)
          self.f = f
          print(self.f)

  b : Box[int] = None
  b = Box()
  print(b.getF())`
  const ast = parse(source);
  // const util = require('util')
  // console.log(util.inspect(ast, false, null, true /* enable colors */))  
  
  const repl = new BasicREPL(await addLibs());
  const result = repl.run(source).then(result => {
    console.log(result);    
  })  
}

debug();

