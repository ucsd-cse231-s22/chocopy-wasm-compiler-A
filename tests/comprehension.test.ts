import { assertPrint, assertTCFail, assertTC, assertFail } from "./asserts.test";

describe("List Comprehension Tests", () => {

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
class Range(object):
    min:int=0
    max:int=0
    curr:int=0
    def __init__(self:Range):
        pass
    def new(self:Range,min:int,max:int)->Range:
        self.max=max
        self.min=min
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
m: int = 0
j:int=2
a=Range().new(5,7)
[j for m in a]`, ['2', '2']
    );

    assertPrint("simple comprehension output with only max range", `
class Range(object):
    min:int=0
    max:int=0
    curr:int=0
    def __init__(self:Range):
        pass
    def new(self:Range,max:int)->Range:
        self.max=max
        return self
    def hasNext(self:Range)->bool:
        return self.curr<self.max
    def next(self:Range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
a:Range=None
j: int = 7
m: int = 0
a=Range().new(5)
[j for m in a]`, ['7', '7', '7', '7', '7']
    );

    assertPrint("simple comprehension output with bool values", `
class Range(object):
    min:int=0
    max:int=0
    curr:int=0
    def __init__(self:Range):
        pass
    def new(self:Range,min:int,max:int)->Range:
        self.max=max
        self.min=min
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
m: int = 0
j:bool=True
a=Range().new(1,5)
[j for m in a]`, ['True', 'True', 'True', 'True',]
    );

    assertPrint("simple comprehension output with expr values", `
class Range(object):
    min:int=0
    max:int=0
    curr:int=0
    def __init__(self:Range):
        pass
    def new(self:Range,min:int,max:int)->Range:
        self.max=max
        self.min=min
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
m: int = 0
j:int=5
a=Range().new(1,5)
[j*2 for m in a]`, ['10', '10', '10', '10',]
    );

    assertPrint("simple comprehension output using iterable class methods", `
class Range(object):
    min:int=0
    max:int=0
    curr:int=0
    def __init__(self:Range):
        pass
    def new(self:Range,min:int,max:int)->Range:
        self.max=max
        self.min=min
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
m: int = 0
a=Range().new(1,5)
[m for m in a]`, ['1', '2', '3', '4']
    );

    assertPrint("simple comprehension output using iterable class methods and expr values", `
class Range(object):
    min:int=0
    max:int=0
    curr:int=0
    def __init__(self:Range):
        pass
    def new(self:Range,min:int,max:int)->Range:
        self.max=max
        self.min=min
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
m: int = 0
a=Range().new(1,5)
[m*3 for m in a]`, ['3', '6', '9', '12']
    );

    assertPrint("simple comprehension output with if condition", `
class Range(object):
    min:int=0
    max:int=0
    curr:int=0
    def __init__(self:Range):
        pass
    def new(self:Range,min:int,max:int)->Range:
        self.max=max
        self.min=min
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
m: int = 0
a=Range().new(1,5)
[m for m in a if m!=3]`, ['1', '2', '4']
    );

    assertPrint("simple comprehension output with bool binop expr values and if condition", `
class Range(object):
    min:int=0
    max:int=0
    curr:int=0
    def __init__(self:Range):
        pass
    def new(self:Range,max:int)->Range:
        self.max=max
        return self
    def hasNext(self:Range)->bool:
        return self.curr<self.max
    def next(self:Range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
a:Range=None
j: int = 3
m: int = 0
a=Range().new(6)
[j<m for m in a if m>2]`, ['False', 'True', 'True']
    );

    assertPrint("simple comprehension output with function call as expr values", `
class Range(object):
    min:int=0
    max:int=0
    curr:int=0
    def __init__(self:Range):
        pass
    def new(self:Range,max:int)->Range:
        self.max=max
        return self
    def hasNext(self:Range)->bool:
        return self.curr<self.max
    def next(self:Range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
def f(x:int)->int:
    return x*5
a:Range=None
j: int = 5
m: int = 0
a=Range().new(5)
[f(j) for m in a]`, ['25', '25', '25', '25', '25']
    );

    assertPrint("simple comprehension output with function call using counter variable as expr values", `
class Range(object):
    min:int=0
    max:int=0
    curr:int=0
    def __init__(self:Range):
        pass
    def new(self:Range,max:int)->Range:
        self.max=max
        return self
    def hasNext(self:Range)->bool:
        return self.curr<self.max
    def next(self:Range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
def f(x:int)->int:
    return x*5
a:Range=None
j: int = 5
m: int = 0
a=Range().new(5)
[f(m) for m in a]`, ['0', '5', '10', '15', '20']
    );

    assertPrint("simple comprehension output with step", `
class Range(object):
    min:int=0
    max:int=0
    curr:int=0
    step:int=1
    def __init__(self:Range):
        pass
    def new(self:Range,min:int,max:int,step:int)->Range:
        self.max=max
        self.min=min
        self.curr=min
        self.step=step
        return self
    def hasNext(self:Range)->bool:
        return self.curr<self.max
    def next(self:Range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+self.step
        return c
a:Range=None
m: int = 0
a=Range().new(10,20,2)
[m for m in a]`, ['10', '12', '14', '16', '18']
    );

    assertPrint("Two comprehension expressions", `
class Range(object):
    min:int=0
    max:int=0
    curr:int=0
    def __init__(self:Range):
        pass
    def new(self:Range,min:int,max:int)->Range:
        self.max=max
        self.min=min
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
m: int = 0
j:int=2
a=Range().new(5,7)
[m for m in a]
a=a.new(10,15)
[m for m in a]`, ['5', '6', '10', '11', '12', '13', '14']
    );

    assertPrint("simple function calls 1", `
class Range(object):
    min:int=0
    max:int=0
    curr:int=0
    def __init__(self:Range):
        pass
    def new(self:Range,max:int)->Range:
        self.max=max
        return self
    def hasNext(self:Range)->bool:
        return self.curr<self.max
    def next(self:Range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
def f():
    a:Range=None
    m: int = 0
    a=Range().new(5)
    [m for m in a]
f()`, ['0', '1', '2', '3', '4']
    );

    assertPrint("simple function calls 2", `
class Range(object):
    min:int=0
    max:int=0
    curr:int=0
    def __init__(self:Range):
        pass
    def new(self:Range,max:int)->Range:
        self.max=max
        return self
    def hasNext(self:Range)->bool:
        return self.curr<self.max
    def next(self:Range)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
def f(j:int):
    a:Range=None
    m: int = 0
    a=Range().new(5)
    [j*5 for m in a]
f(10)`, ['50', '50', '50', '50', '50']
    );


    assertPrint("simple list comprehension with object of any other class with next and hasNext methods", `
class ABC(object):
    min:int=0
    max:int=0
    curr:int=0
    def __init__(self:ABC):
        pass
    def new(self:ABC,min:int,max:int)->ABC:
        self.min=min
        self.max=max
        self.curr=min
        return self
    def hasNext(self:ABC)->bool:
        return self.curr<self.max
    def next(self:ABC)->int:
        c:int=0
        c=self.curr
        self.curr=self.curr+1
        return c
a:ABC=None
i:int=0
j:int=25
a=ABC().new(0,5)
[j for i in a if i!=2]`, ['25', '25', '25', '25']
    );

    assertTCFail("simple list comprehension with object of any other class without next and hasNext methods", `
class ABC(object):
    min:int=0
    max:int=0
    curr:int=0
    def __init__(self:ABC):
        pass
    def new(self:ABC,min:int,max:int)->ABC:
        self.min=min
        self.max=max
        self.curr=min
        return self
a:ABC=None
i:int=0
j:int=25
a=ABC().new(0,5)
[j for i in a if i!=2]`);

});