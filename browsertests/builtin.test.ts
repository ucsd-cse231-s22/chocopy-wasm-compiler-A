import { assertPrint, assertRunTimeFail, assertTCFail, assertRepl } from './browser.test';

// builtin-lib tests
describe("built-in library testes",()=>{

assertPrint("sleep 2 seconds",`
st:int = 0
ed:int = 0
st = time()
sleep(10)
ed = time()
print(ed-st)
`, ["10"])

assertPrint("factorial", `
c : int = 4
print(factorial(c))
`, ["24"])

assertPrint("max",`
c : int = 3
d: int = 2
print(max(factorial(c), factorial(d)))
`, ["6"])

assertPrint("pow", `
c : int = 3
d: int = 2
print(pow(c, d))
`, ["9"])

assertPrint("LCM", `
print(lcm(4,6))
print(lcm(3,5))
print(lcm(2,8))
`, ['12', '15', '8'])

assertPrint("GCD",`
print(gcd(4,6))
print(gcd(3,5))
print(gcd(2,8))
`, ['2','1','2'])

assertPrint("Combination",`
print(comb(4,2))
print(comb(10,3))
print(comb(20,5))
`, ["6","120","15504"])

assertPrint("Permutation",`
print(perm(4,2))
print(perm(10,3))
print(perm(20,5))
`, ["12","720", "1860480"])
})
