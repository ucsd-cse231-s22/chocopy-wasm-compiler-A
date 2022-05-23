## Bignums
Our features would not interact much. For example:
```Python
a : int = 0
b : int = 1
a, b = (1000000000000000, 9999999999999999)
```
In this case, we do not care what exactly is in `()`, but only perform check on whether the contents could be assigned to `a` or `b` respectovely, which would be checked by `isAssignable`. 