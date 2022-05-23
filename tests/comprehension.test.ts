import { assertPrint, assertTCFail, assertTC, assertFail } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("List Comprehension Tests", () => {

    assertPrint("simple comprehension output with step", `
class range(object):
    curr: int = 0
    min: int = 0
    max: int = 10
    step:int = 1
    def __init__(self: range, min: int, max: int, step:int):
        self.curr = min
        self.min = min
        self.max = max
        self.step = step
    def next(self: range) -> int:
        c: int = 0
        c = self.curr
        self.curr = self.curr + self.step
        return c
    def hasNext(self: range) -> bool:
        return self.curr < self.max
j:int=3
print([k for k in range(10,20,2)])`, ['10', '12', '14', '16', '18']
    );


    assertTCFail("invalid expression in comprehension", `
class range(object):
    curr:int=0
    min:int=0
    max:int=10
    def __init__(self:range, min:int, max:int):
        self.curr=min
        self.min=min
        self.max=max
    def next(self:range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
    def hasNext(self:range)->bool:
        return self.curr<self.max
[j for a in range(1,5) if a!=1]
`);


    assertTCFail("invalid range in comprehension", `
class range(object):
    curr:int=0
    min:int=0
    max:int=10
    def __init__(self:range, min:int, max:int):
        self.curr=min
        self.min=min
        self.max=max
    def next(self:range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
    def hasNext(self:range)->bool:
        return self.curr<self.max
j:int=2
[j for a in range(2,1)]
  `);

    assertTCFail("Not if in comprehension", `
class range(object):
    curr:int=0
    min:int=0
    max:int=10
    def __init__(self:range, min:int, max:int):
        self.curr=min
        self.min=min
        self.max=max
    def next(self:range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
    def hasNext(self:range)->bool:
        if self.curr<self.max:
            return True
        else:
            return False
j:int=2
[j for a in range(1,5) for a!=1]
`);

    assertTCFail("invalid condition in comprehension", `
class range(object):
    curr:int=0
    min:int=0
    max:int=10
    def __init__(self:range, min:int, max:int):
        self.curr=min
        self.min=min
        self.max=max
    def next(self:range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
    def hasNext(self:range)->bool:
        return self.curr<self.max
j:int=9
[j for a in range(1,5) if a+2]
`);

    assertTCFail("invalid iterable in comprehension", `
class range(object):
    curr:int=0
    min:int=0
    max:int=10
    def __init__(self:range, min:int, max:int):
        self.curr=min
        self.min=min
        self.max=max
    def next(self:range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
    def hasNext(self:range)->bool:
        return self.curr<self.max
j:int=9
k:int=10
[j for a in k if a!=2]
`);

    assertPrint("simple comprehension output with min and max range", `
class range(object):
    curr: int = 0
    min: int = 0
    max: int = 10
    def __init__(self: range, min: int, max: int):
        self.curr = min
        self.min = min
        self.max = max
    def next(self: range) -> int:
        c: int = 0
        c = self.curr
        self.curr = self.curr + 1
        return c
    def hasNext(self: range) -> bool:
        return self.curr < self.max
j: int = 2
print([j for a in range(5,7)])`, ['2', '2']
    );

    assertPrint("simple comprehension output with only max range", `
class range(object):
    curr: int = 0
    min: int = 0
    max: int = 10
    def __init__(self: range, min: int, max: int):
        self.curr = min
        self.min = min
        self.max = max
    def next(self: range) -> int:
        c: int = 0
        c = self.curr
        self.curr = self.curr + 1
        return c
    def hasNext(self: range) -> bool:
        return self.curr < self.max
j: int = 7
print([j for b in range(5)])`, ['7', '7', '7', '7', '7']
    );

    assertPrint("simple comprehension output with bool values", `
class range(object):
    curr:int=0
    min:int=0
    max:int=10
    def __init__(self:range, min:int, max:int):
        self.curr=min
        self.min=min
        self.max=max
    def next(self:range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
    def hasNext(self:range)->bool:
        return self.curr<self.max
j:bool=True
[j for c in range(1,5)]`, ['True', 'True', 'True', 'True',]
    );

    assertPrint("simple comprehension output with expr values", `
class range(object):
    curr:int=0
    min:int=0
    max:int=10
    def __init__(self:range, min:int, max:int):
        self.curr=min
        self.min=min
        self.max=max
    def next(self:range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
    def hasNext(self:range)->bool:
        return self.curr<self.max
j:int=5
print([j*2 for d in range(1,5)])`, ['10', '10', '10', '10',]
    );

    assertPrint("simple comprehension output using iterable class methods", `
class range(object):
    curr:int=0
    min:int=0
    max:int=10
    def __init__(self:range, min:int, max:int):
        self.curr=min
        self.min=min
        self.max=max
    def next(self:range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
    def hasNext(self:range)->bool:
        return self.curr<self.max
j:int=5
[e for e in range(1,5)]`, ['1', '2', '3', '4']
    );

    assertPrint("simple comprehension output using iterable class methods and expr values", `
class range(object):
    curr:int=0
    min:int=0
    max:int=10
    def __init__(self:range, min:int, max:int):
        self.curr=min
        self.min=min
        self.max=max
    def next(self:range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
    def hasNext(self:range)->bool:
        return self.curr<self.max
j:int=5
[f*3 for f in range(1,5)]`, ['3', '6', '9', '12']
    );

    assertPrint("simple comprehension output with if condition", `
class range(object):
    curr:int=0
    min:int=0
    max:int=10
    def __init__(self:range, min:int, max:int):
        self.curr=min
        self.min=min
        self.max=max
    def next(self:range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
    def hasNext(self:range)->bool:
        return self.curr<self.max
j:int=5
[g for g in range(1,5) if g!= 3]`, ['1', '2', '4']
    );

    assertPrint("simple comprehension output with bool binop expr values and if condition", `
class range(object):
    curr:int=0
    min:int=0
    max:int=10
    def __init__(self:range, min:int, max:int):
        self.curr=min
        self.min=min
        self.max=max
    def next(self:range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
    def hasNext(self:range)->bool:
        return self.curr<self.max
j:int=3
[j<i for i in range(6) if i>2]`, ['False', 'True', 'True']
    );

    assertPrint("simple comprehension output with function call as expr values", `
class range(object):
    curr:int=0
    min:int=0
    max:int=10
    def __init__(self:range, min:int, max:int):
        self.curr=min
        self.min=min
        self.max=max
    def next(self:range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
    def hasNext(self:range)->bool:
        return self.curr<self.max
def f(x:int)->int:
    return x*5
j: int = 5
print([f(j) for l in range(5)])`, ['25', '25', '25', '25', '25']
    );

    assertPrint("test", `
class Range(object):
    min:int=0
    max:int=0
    curr:int=0
    def __init__(self:Range):
        pass
    def new(self:Range,min:int,max:int)->Range:
        self.min=min
        self.max=max
        self.curr=min
        return self
    def hasNext(self:Range)->bool:
        return self.curr<self.max
    def next(self:Range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
a:Range=None
b:Range=None
i:int=0
j:int=25
a=Range().new(0,5)
b=[j for i in a if i!=2]`, ['25', '25', '25', '25']
    );

    assertPrint("test", `
class Range(object):
    min:int=0
    max:int=0
    curr:int=0
    def __init__(self:Range):
        pass
    def new(self:Range,min:int,max:int)->Range:
        self.min=min
        self.max=max
        self.curr=min
        return self
    def hasNext(self:Range)->bool:
        return self.curr<self.max
    def next(self:Range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
a:Range=None
b:Range=None
i:int=0
j:int=25
a=Range().new(0,5)
b=[j for i in a if i!=2]`, ['25', '25', '25', '25']
    );

    assertPrint("test", `
class Range(object):
    min:int=0
    max:int=0
    curr:int=0
    def __init__(self:Range):
        pass
    def new(self:Range,min:int,max:int)->Range:
        self.min=min
        self.max=max
        self.curr=min
        return self
    def hasNext(self:Range)->bool:
        return self.curr<self.max
    def next(self:Range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
a:Range=None
b:Range=None
i:int=0
j:int=25
a=Range().new(0,5)
b=[j for i in a if i!=2]`, ['25', '25', '25', '25']
    );

});
