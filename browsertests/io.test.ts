import { assertPrint, assertRunTimeFail, assertTCFail, assertRepl } from './browser.test';


describe("File System testing", () => {
    assertTCFail("read fail (need one more argument)", `
f:File = None
f = open(0, 0)
f.read()
f.close()`);
    

    const s8 = `
f:File = None
f = open(0, 0)
f.write()
f.close()`;
    assertTCFail("not correct mode for write", s8);
// assertPrint("simple read write",
// `
// f:File = None
// f = open(0, 3)
// f.write(5)
// f.seek(0)
// print(f.read(1))
// `, [`5`])

// assertRunTimeFail("read fail",
// `
// f:File = None
// f = open(0, 3)
// f.read(0)
// f.close()`)
})
