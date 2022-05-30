import { assertPrint, assertRunTimeFail, assertTCFail, assertRepr } from './browser.test';


describe("Simple browser tests", () => {
    assertPrint('Simple print test', `
    print(123)
    print(456)`, ["123", "456"]);
    
    assertRunTimeFail('Simple runtime fail test', `
class C(object):
    x : int = 0        
c : C = None
c.x`);

    assertTCFail('Simple typecheck fail test', `
a: int = True`);
    assertRepr("Simple repr", `print(123)`, [`print(456)`, `print(789)`], [["123"], ["456"], ["789"]])

});