import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
  T = TypeVar('T')

  class Box(Generic[T]):
    a: T = __ZERO__
    
    def callGenFunc(self: Box[T]):
      b2 : Box[int] = None
      b2 = Box()
      print(genericFunc(3, 4, b2))

  def genericFunc(a: int, x: T, y: Box[T]) -> T :
    y.a = x
    return y.a

  b1 : Box[int] = None  
  b1 = Box()
  b1.callGenFunc()
  `
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


