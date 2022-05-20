# CSE231 Final Project Design

## Interfaces

### AST

```typescript=
{  a?: A, tag: "call", name: string, arguments: Array<Expr<A>>, kwarguments?: Map<string, Expr<A>> } 
{  a?: A, tag: "method-call", obj: Expr<A>, method: string, arguments: Array<Expr<A>>, kwarguments?: Map<string, Expr<A>> }

export type Parameter<A> = { 
    name: string, 
    type: Type,
    value?: Expr<A>,
}

export type FunDef<A> = { 
    a?: A, 
    name: string, 
    parameters: Array<Parameter<A>>, 
    ret: Type, 
    inits: Array<VarInit<A>>, 
    body: Array<Stmt<A>>,
    arbarg_idx?: number,
    kwarg_idx?: number,
}
```

To pass the keyword arguments, we use an optional attribute `kwarguments` to map the keyword to the value(an expression). In the parser, we will parse the arguments into either `arguments` or `kwarguments`. Then, we set and check the arguments in type checker. Note that, after type checking, the length of `arguments` should be consistent with the length in function definition. And the `kwarguments` would be empty (or `null`) and should not be used after type checking. 
To deal with parameters with default value, we would like to add an attribute call `value` in `Parameter<A>` to store the default value. It could be any expression at the parsing stage. If there's no specific default value, the attribute will be set to `null`. This can also help us distinguish `None` from no default value.
To deal with arbitrary arguments and keyword arguments, we would like to add attribute `arbarg_idx` to store the index of the tuple for the arbitrary arguments, and `kwarg_idx` to store the index of the dictionary for the keyword arguments. Since we will see all the arbitrary arguments as a tuple, and all the keyword arguments as a dictionary, we store the indices of them to distinguish them from normal tuple and dict parameters.

### IR

```typescript=
import {Type, BinOp, UniOp} from './ast';

export type Parameter<A> = { 
    name: string, 
    type: Type,
}

export type FunDef<A> = { 
    a?: A, 
    name: string, 
    parameters: Array<Parameter<A>>, 
    ret: Type, 
    inits: Array<VarInit<A>>, 
    body: Array<BasicBlock<A>>,
    arbarg_idx?: number,
    kwarg_idx?: number,
}
```

The changes in IR are similar to AST, except that we could get the default value of parameters to be `Value<A>` type.

### type-check

```typescript=
export type GlobalTypeEnv = {
  globals: Map<string, Type>,
  functions: Map<string, [Array<Parameter<Type>>, Type]>,
  classes: Map<string, [Map<string, Type>, Map<string, [Array<Parameter<Type>>, Type]>]>
}
```

For checking the keyword arguments and default value of function calls and method calls, we expand the definition of environment from only storing parameters' types to storing whole `Parameter<A>` which includes name, type, and default value.

## Implementation Strategy

### Stage 1
position arguments & keyword arguments

#### Definition
- parser: 
    - allow default value (expr) and check their order
        - `SyntaxError: non-default argument follows default argument`
- type checker:
    - check the 1st argument w/ assigned as that class
    - renamed argument: implemented
    - type match function definition: implemented
- lower: 
    - Use `lowerFunDef` is enough
- compiler: 
    - Use `codeGenDef` is enough

#### Function call
- parser:
    - allow arguments w/ name
        - keyword arguments need to be after all of position arguments
    - pass the kwargs by Map
- type checker:
    - Check all values assigned
        - `TypeError: f() missing 1 required positional argument: 'a'`
    - Fill the argument list first then check the length of list.
        - `TypeError: f() got multiple values for argument 'a'`
    - Check all keyword defined
        - `TypeError: f() got an unexpected keyword argument 'a'`
- lower: 
    - Use `flattenExprToExpr()` is enough
- compiler: 
    - Use `codeGenExpr` is enough

### Stage 2
arbitrary arguments and arbitrary keyword arguments

#### Definition
- parser: 
    - deal with `*args` and `**kwargs`
    - kwargs need to be the last argument
- type checker:
    - Use code in Stage 1 is enough
- lower: 
    - Use `lowerFunDef` is enough
- compiler:
    - Use `codeGenDef` is enough

#### Function call
- parser:
    - Use code in Stage 1 is enough
- type checker:
    - deal with argument list
        1. deal with position arguments
        2. convert arguments from `*args` as a tuple.
        3. keyword arguments
            - place defined keyword arguments to the specific position.
            - convert arguments with no defined keyword as dictionary.
        4. place `*args` tuple and `**args` dictionary on the specific position.
    - :warning: This would be dependent on the tuple and dictionary
- lower: 
    - Use functions from tuple and dict team to generate IR
    - :warning: This would be dependent on the tuple and dictionary
- compiler:
    - Use functions from tuple and dict team to generate WASM
    - :warning: This would be dependent on the tuple and dictionary


## Testcases

### Stage 1
#### Basic function tests
```python=
def f(x : int, y : int = 5, z : int = 10):
    print(x)
    print(y)
    print(z)
    
#1 parameter assign and default parameter value #expected [1,5,10]
f(1,) 

#2 default parameter assign #expected [1,2,10]
f(1,2)

#3 specify parameter assign1 #expected [1,3,10]
f(1,y=3)

#4 specify parameter assign2 #expected [1,5,5]
f(1,z=5)

#5 specify parameter assign3 #expected [1,3,5]
f(1,z=5, y=3)
```

#### Function argument tests
```python=
def f(x : int, y : int = 5, z : int = 10):
    print(x)
    print(y)
    print(z)
    
#1 missing argument #expected TypeError
f() 

#2 keyword argument repeated #expected SyntaxError
f(x=1, x=1)

#3 multiple values #expected TypeError
f(1, 2, 3, z=4)

#4 unexpected keyword #expected TypeError
f(n=3)

#5 positional argument follows keyword argument #expected SyntaxError
f(1, y=2, 3)

#6 assign wrong type #expected TypeError
f(1, 2, False)
```

#### Function define tests
```python=
#1 duplicate argument #expected SyntaxError
def f(x : int, x : int = 5, z : int = 10):
    print(x)
    print(y)
    print(z)

#2 non-default argument follows default argument #expected SyntaxError
def f(x: int=5, y:int, z:int = 10):
    print(x)
    print(y)
    print(z)
    
#3 expr parameters #expected [1,True,3]
def f(x: int, y:bool = 1<3, z:int = 1 + 2):
    print(x)
    print(y)
    print(z)
f(1)

#4 class parameters #expected [100]
class C(object):
    x:int = 100
def f(c : C):
    print(c.x)
c:C = None
c = C()
f(c)

#5 func return parameter #expected [1]
def d()->int:
    return 1
def f(x : int = d()):
    print(x)
f()
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
