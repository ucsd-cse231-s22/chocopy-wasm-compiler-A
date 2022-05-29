import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
  T = TypeVar('T')

  class Box(Generic[T]):
    a: T = __ZERO__

  def genericFunc(b: int, x: T, y: Box[T]) -> T :
    return x

  b1 : Box[int] = None  
  b1 = Box()
  print(b1.a)
  print(genericFunc(2, 3, b1))
  print(b1.a)
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


