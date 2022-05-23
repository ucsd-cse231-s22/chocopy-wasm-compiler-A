import { assert } from "console";
import { STRING } from "../utils";
import { assertPrint, assertFail, assertTCFail, assertTC } from "./asserts.test";
import { NUM, BOOL, NONE, CLASS } from "./helpers.test"

describe("String tests", () => {

  assertPrint("Print-String-1",`
  print("abcd")`,['abcd'])

  // we need to input string \n so "\\n" is the right input
  assertPrint("Print-String-2",`
  print("ab\\ncd")`,['ab','cd']) 

  assertPrint("Print-String-3",`
  print("ab\\"cd")`,['ab"cd']) 

  assertPrint("Print-String-4",`
  print("ab\\\\cd")`,['ab\\cd']) 

  assertPrint("Print-String-Fun",`
  def get()->str:
    s:str = "abc"
    return s
    
  print(get())   
  `,['abc'])

  assertPrint("Print-String-Class",`
  class C(object):
    s:str = "abc"
  c: C = None
  c = C()
  print(c.s)`,['abc'])

  assertTC("String-In-Fun",`
  def test(x:str)->str:
    return x
  x:str = "abcd"
  test(x)
  `,STRING)

  assertTC("String-TC",`"abcd"`,STRING);

  assertTC("String-In-Fun",`
  def test(x:str)->str:
      return x
  test("abcd")
  `,STRING)

  assertTC("String-In-Class-TC",`
  class C(object):
    x:str = "abc"
  c: C = None
  c = C()
  c.x
  `,STRING)

  assertTCFail("String-Int",`
  x:str = 1
  `);

  assertTCFail("String-Int-In-Fun",`
  def test(str:x)->str:
    x = 1
    return x
  test("abcd")  
  `);

  assertTCFail("String-In-Class-TC",`
  class C(object):
    x:str = "abc"
  c: C = None
  c = C()
  c.x = 1
  `)

  assertPrint("String-Equals-True",`
  print("abcd" == "abcd")
  `,['True'])

  assertPrint("String-Equals-True-In-Fun",`
  def test()->bool:
      return "abcd" == "abcd"
  print(test())
  `,['True'])

  assertPrint("String-Equals-False-1",`
  x:str = "abcd"
  y:str = "bcde"
  print(x == y)
  `,['False'])
  //3
  assertPrint("String-Equals-False-2",`
  print("abcd" == "bcde")
  `,['False'])

  assertPrint("String-Euals-False-In-Fun",`
  def test(x:str,y:str)->bool:
    return x == y
  print(test("abcd","bcde")) 
  `,['False'])

  assertPrint("String-Equals-False-In-Class",`
  class C(object):
    x:str = "abc"
    def compare(self:C, x:str)->bool:
      return self.x == x
  c: C = None
  c = C()
  print(c.compare("bcd"))
  `,['False'])

  assertTC("String-Index-TC",`
  "abcd"[1])
  `,STRING)

  assertPrint("String-Index-In-Fun",`
  def test(x:str)->str:
      return x[1]
  print(test("uiop"))
  `,['i'])

  assertPrint("String-Concatenate",`
  print("abcd" + "bcde")
  `,['abcdbcde'])

  assertPrint("String-Length",`
  print(len("abc"))
  `,['3'])

  assertPrint("String-Concatenate-From-Class-1",`
  class A(object):
    a:str = "abc"
    b:str = "def"

  c: A = None
  c = A()
  print(c.a+c.b)
  `,['abcdef'])

  assertPrint("String-Concatenate-From-Class-2",`
  class A(object):
    a:str = "abc"

  c: A = None
  c = A()
  print(c.a+"def")
  `,['abcdef'])

  assertPrint("String-Concatenate-From-Functions",`
  a:str = "ghi"
  def getStr1()->str:
      return "abc"
      
  def getStr2()->str:
      s:str = "def"
      return s
      
  def getStr3(a:str)->str:
      return a
      
  print(getStr1()+getStr2()+getStr3(a))
  `,['abcdefghi'])

  assertPrint("String-Concatenate-From-Functions-Length",`
  a:str = "def"
  def getStr1()->str:
      return "a"
      
  def getStr2()->str:
      s:str = "bc"
      return s
      
  def getStr3(a:str)->str:
      return a
      
  print(len(getStr1()+getStr2()+getStr3(a)))
  `,['6'])

  assertPrint("String-Concatenate-Index",`
  def getStr()->str:
    return "abc"
    
  print(getStr()[0]+"bcd")
  `,['abcd'])

  assertPrint("String-Index",`
  print("abc"[0])
  `,['a'])

  assertPrint("String-Index-In-Function",`
  a:str = "abc"
  def getFirst(b:str)->str:
    return b[0]
  print(getFirst(a))  
  `,['a'])

  assertPrint("String-Index-Comparison-In-Function-1",`
  a:str = "abc"
  b:str = "abc"
  def getFirst(a:str)->str:
    return a[0]
  def getSecond(a:str)->str:
    return a[1]
  print(getFirst(a) == getSecond(b))  
  `,['False'])

  assertPrint("String-Index-Comparison-In-Function-2",`
  a:str = "abc"
  def getFirst(a:str)->str:
    return a[0]
  def getSecond(a:str)->str:
    return a[1]
  print(getFirst(a) == "abc")  
  `,['False'])

  assertPrint("String-Index-Comparison-In-Function-3",`
  a:str = "abc"
  def getFirst(a:str)->str:
    return a[0]
  def getSecond(a:str)->str:
    return a[1]
  print(getFirst(a) == getFirst("abc"))  
  `,['True'])

  assertPrint("String-Index-Comparison-In-Class",`
  class A():
    s:str = "abc"
  class B():
    s:str = "def"
  c: A = None
  d: B = None
  c = A()
  d = B()
  print(c.s[0] == d.s[0])  
  `,['False'])

});
