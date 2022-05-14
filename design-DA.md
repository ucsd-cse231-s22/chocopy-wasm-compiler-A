## AST
For ast, we have to add a new representation for destructuring assignment. Meanwhile, the new representation is supposed to be compatible with the previous plain assignment statement. In this new representation, we will abstract our left expression and right expression. For left expression, we will also add a new ast representation which includes the information about each element in the left structure, such as whether the element is `_` or is marked with `*`. For the right expression, we will reuse the ast nodes of list, tuple. However, given the potential dependency relationship on other teams, we may first choose to use a plain expression array as the left expression for implementation, and then make migration to our complete design.

## TC
For type checking, we will check whether the lengths of the left and right structures are matched. We have to handle the element marked with `*` here, which will introduce the issues of alignment. This element can be matched by the arbitrary length of elements in the right structure. Basically, we only need to consider plain elements on the left side, because the length of the list-like structure in Python is variable.


## CODE GEN
For code generation, the high-level implementation is to iterate every element in the left structure and assign the correct values to them respectively from the right structure. It's worth noting that we need to handle the element marked with `*`. For this special element, we will assign the value after assigning all the values to the plain elements.

## Milestone 1
During this week, we implemented most functions in our previous design except handling list and tuple in the right part and the element marked with `*`, which depended on other teams' work. Additionally, we added support for range, which had not been metioned in our previous design. We mainly changed ast.ts, parser.ts, type-check.ts, and lower.ts. All this code is runnable and testable. We added new tests in a separated file called destructure.test.ts. You can run them by executing `npm run test-desdestructure`.
