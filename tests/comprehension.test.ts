import { assertPrint, assertTCFail, assertTC, assertFail } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("List Comprehension Tests", () => {
//havent properly written next and hasnext yet
  assertTCFail("invalid expression in comprehension", `
class range(object):
    a:int=9
    b:int=10
    def __init__(self:range, a:int, b:int):
        self.a=a,self.b=b
    def next(q:int,w:int)->int:
        return 3
    def hasNext(q:int,w:int)->int:
        return 3
print([j for a in range(1,2) if 1<2])
  `);


assertTCFail("invalid range in comprehension", `
class range(object):
    a:int=9
    b:int=10
    def __init__(self:range, a:int, b:int):
        self.a=a,self.b=b
    def next(q:int,w:int)->int:
        return 3
    def hasNext(q:int,w:int)->int:
        return 3
print([j for a in range(2,1) if 1<2])
  `);
  
assertTCFail("Not if in comprehension", `
class range(object):
    a:int=9
    b:int=10
    def __init__(self:range, a:int, b:int):
        self.a=a,self.b=b
    def next(q:int,w:int)->int:
        return 3
    def hasNext(q:int,w:int)->int:
        return 3
print([j for a in range(1,2) for 1<2])
`);
  
assertTCFail("invalid condition in comprehension", `
class range(object):
    a:int=9
    b:int=10
    def __init__(self:range, a:int, b:int):
        self.a=a,self.b=b
    def next(q:int,w:int)->int:
        return 3
    def hasNext(q:int,w:int)->int:
        return 3
print([j for a in range(1,2) if 1+2])
  `);

assertTCFail("invalid iterable in comprehension", `
class range(object):
    a:int=9
    b:int=10
    def __init__(self:range, a:int, b:int):
        self.a=a,self.b=b
    def next(q:int,w:int)->int:
        return 3
    def hasNext(q:int,w:int)->int:
        return 3
print([j for a in A if 1<2])
`);




});
