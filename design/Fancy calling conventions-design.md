# CSE231 Final Project Design

Members:

- Lien-Bee Huang (lih004@ucsd.edu)
- Xi-Zhen Liu (xil087@ucsd.edu)
- Yang-Hang Wu (yaw038@ucsd.edu)

## Interfaces

### AST

```typescript=

export type Parameter<A> = { 
    name: string, 
    type: Type,
    value: Expr<A>,
}
export type FunDef<A> = { 
    a?: A, 
    name: string, 
    parameters: Array<Parameter<A>>, 
    ret: Type, 
    inits: Array<VarInit<A>>, 
    body: Array<Stmt<A>>,
    arbarg_idx: number,
    kwarg_idx: number,
}
```

To deal with parameters with default value, we would like to add an attribute call `value` in `Parameter<A>` to store the default value. It could be any expression at the parsing stage. If there's no specific default value, the attribute will be set to `null`. This can also help us distinguish `None` from no default value.
To deal with arbitrary arguments and keyword arguments, we would like to add attribute `arbarg_idx` to store the index of the tuple for the arbitrary arguments, and `kwarg_idx` to store the index of the dictionary for the keyword arguments. Since we will see all the arbitrary arguments as a tuple, and all the keyword arguments as a dictionary, we store the indices of them to distinguish them from normal tuple and dict parameters.

### IR

```typescript=
import {Type, BinOp, UniOp} from './ast';

export type Parameter<A> = { 
    name: string, 
    type: Type, 
    value: Value<A> 
}

export type FunDef<A> = { 
    a?: A, 
    name: string, 
    parameters: Array<Parameter<A>>, 
    ret: Type, 
    inits: Array<VarInit<A>>, 
    body: Array<BasicBlock<A>>,
    arbarg_idx: number,
    kwarg_idx: number,
}
```

The changes in IR are similar to AST, except that we could get the default value of parameters to be `Value<A>` type.

## Testcases

### Stage 1

Support arguments with basic types and accept default value setting

```python=
def f(x : int, x : int = 5, z : int = 10): # redefine argument name

def f(x : int, y : int = 5, z : int = 10):

f()
f(1)
f(1,)
f(1, 2)
f(1, 2, 3)
f(1, y=3)
f(1, z=5, y=3)
f(1, z=5, z=3)
f(1, 2, 3, z=4)
f(n=3)
f(1, y=2, 3)

def f(x: int, y:bool = 1<3, z:int = 1 + 2) # parameters are not only simple numbers but expressions

class C:
    x = 100
def f(c : C = C()): # Object as parameter default value
    print(c.x)
    
def d()->int:
    return 1
def f(x : int = d()): # Function return as parameter default value
    print(x)
```

### Stage 2

Support tuple arguments and keyword arguments.
(Require tuples and dictionaries to be implemented)

```python=
def f(x : int, **kwargs, *args):

def f(x : int, *args, **kwargs):

f(1)
f(1,)
f(1,2,3)
f(1, y=3)
f(1, z=5, y=3)
f(1, z=5, z=3)
f(1, 2, 3, x=4)
f(n=3)
f(1, y=2, 3)
f(y=1, x=2)

def f(a, *ab, *ac):
```
