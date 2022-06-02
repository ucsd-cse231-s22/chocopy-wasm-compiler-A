import { parse } from "./parser";
import { BasicREPL } from "./repl";
import { addLibs  } from "./tests/import-object.test";


// entry point for debugging
async function debug() {
  var source = `
  T = TypeVar('T')

  class Box(Generic[T]):
    v: T = __ZERO__

    def map(self: Box[T], f: Callable[[T], T]) -> Box[T]:
      b : Box[T] = None
      b = Box()

      b.v = f(self.v)
      return b

  b1 : Box[int] = None
  b1 = Box()
  print(b1.v)
  print(b1.map(mklambda(Callable[[int], int], lambda a: a + 2)).v)
  print(b1.map(mklambda(Callable[[int], int], lambda a: (a + 1) * 10)).v)
  print(b1.v)
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


