Please find the terminology below. Basic format for "For" Loops is given below

For (iterator in Values) 
    block of statements 

For this week, we are only focusing on cases where "Values" in the above format is derived from one builtin function (Range and its variants)


TestCase 1: Validate that "Values" in the loop cannot be Range(). Throw a typecheck error for numer of arguments

Input:

i:int = 0
for i in range():
  print(i)

Expected Output : TYPE ERROR: expected 2 parameters instead got 0

TestCase 2: Parameters of range should be integers and start <=end. Else, throw typecheck error (design decision)

Input
i:int = 0
for i in range(10,1):
  print(i)

Expected Output : TYPE ERROR: start value in the range should be less than end value of the range

TestCase 3: Valid program with range(start,end)

Input
i:int = 0
for i in range(3,6):
  print(i)

Expected Output : 3 4 5

Testcase 4: Modifying iterator within same type should be allowed

Input 
i:int = 1
for i in range(1,4):
   print(i)
   i = 10 
   print(i)

Expected Output: 1 10 2 10 3 10

Testcase 5: Modifying iterator to different type should throw error

Input 
i:int = 1
for i in range(1,5):
   print(i)
   i = True 
   print(i)

Expected Output: Expected int got bool

Testcase 6: Range with one argument as negative number

Input 
i:int = 1
for i in range(-4, 3):
  print(i)

Expected output: -4 -3 -2 -1 0 1 2

Testcase 7: Range with one argument

Input 
i:int = 1
for i in range(10):
  print(i)

Expected output: 0 1 2 3 4 5 6 7 8 9

Testcase 8: Using break statement within for loop block

Input 
i:int = 1
for i in range(3):
  print(i)
  if (i==2):
    break

Expected output: 0 1 2

Testcase 9: Using continue statement within for loop block

Input 
i:int=0
for i in range(4):
  if (i==2):
    continue
  print(i)
  

Expected output: 0 1 3

Testcase 10: Type checking iterator and values list

Input 
i:bool = True
for i in range(4):
   print(i)
   i = True 
   print(i)

Expected output: Type Error expected bool, got int

Changes to AST.ts include 

export type Stmt<A> =
  | {  a?: A, tag: "for", iterator: Expr<A>, values: Expr<A>, body: Array<Stmt<A>> }