// @ts-nocheck
import * as webdriver from 'selenium-webdriver';
import "mocha";
import { expect } from "chai";
import { doesNotMatch } from 'assert';
import {Options} from 'selenium-webdriver/chrome'
require('chromedriver');

var driver;
export default driver;

before(async function () {
    const opts = new Options();
    opts.addArguments('--headless', '--no-sandbox')
    driver = await new webdriver.Builder().forBrowser("chrome").setChromeOptions(opts).build();
    await driver.get("http://127.0.0.1:8000");
});

afterEach(async function() {
    await driver.get("http://127.0.0.1:8000");
});

after(async function () {
    await driver.quit();
});

function emptyStatement(source: string){
    for (let i=0; i<source.length; i++) {
        if (source[i]!==" ") return false;
    }
    return true;
}

export async function assertPrint(name:string, source: string, expected: Array<string>) {
    it(name, async function () {
        //Send and run source
        await driver.wait(webdriver.until.elementLocated(webdriver.By.id("user-code")));
        await driver.findElement(webdriver.By.id("user-code")).sendKeys(source);
        await driver.findElement(webdriver.By.id("run")).click(); 
        //Check output length is equal to expected
        await driver.wait(webdriver.until.elementLocated(webdriver.By.xpath("//*[@id=\"output\"]/pre")));
        let vars = await driver.findElements(webdriver.By.xpath("//*[@id=\"output\"]/pre"));
        expect(vars.length).to.deep.eq(expected.length+1);
        //Retrieve output as array
        let results = [];
        for (let i=1; i<expected.length+1; i++) {
            results.push(await driver.findElement(webdriver.By.xpath(`//*[@id=\"output\"]/pre[${i}]`)).getText());
        }
        expect(results).to.deep.eq(expected);
    });
}

export async function assertTCFail(name: string, source: string){
    it(name, async function () {
        //Send and run source
        await driver.wait(webdriver.until.elementLocated(webdriver.By.id("user-code")));
        await driver.findElement(webdriver.By.id("user-code")).sendKeys(source);
        await driver.findElement(webdriver.By.id("run")).click(); 
        //Check output
        await driver.wait(webdriver.until.elementLocated(webdriver.By.xpath("//*[@id=\"output\"]/pre")));
        let vars = await driver.findElements(webdriver.By.xpath("//*[@id=\"output\"]/pre"));
        expect(vars.length).to.deep.eq(1);
        expect(await driver.findElement(webdriver.By.xpath(`//*[@id=\"output\"]/pre[${1}]`)).getText()).to.contain("TYPE ERROR:");
    });
}

export async function assertRunTimeFail(name: string, source: string){
    it(name, async function () {
        //Send and run source
        await driver.wait(webdriver.until.elementLocated(webdriver.By.id("user-code")));
        await driver.findElement(webdriver.By.id("user-code")).sendKeys(source);
        await driver.findElement(webdriver.By.id("run")).click(); 
        //Check output
        await driver.wait(webdriver.until.elementLocated(webdriver.By.xpath("//*[@id=\"output\"]/pre")));
        let vars = await driver.findElements(webdriver.By.xpath("//*[@id=\"output\"]/pre"));
        expect(vars.length).to.deep.eq(1);
        expect(await driver.findElement(webdriver.By.xpath(`//*[@id=\"output\"]/pre[${1}]`)).getText()).to.contain("RUNTIME ERROR:");
    });
}


// Currently repr do not support multiple lines. In the current implementation, it will directly be directly executed when the switch-line get pressed.
export async function assertRepr(name: string, source: string, repls: Array<string>, expected: Array<Array<string>>){
    it(name, async function () {
        expect(expected.length).to.deep.above(0);
        expect(repls.length+1).to.deep.eq(expected.length);
        //Verify the result of running the source
        if (!emptyStatement(source)){
            //Send and run source
            await driver.wait(webdriver.until.elementLocated(webdriver.By.id("user-code")));
            await driver.findElement(webdriver.By.id("user-code")).sendKeys(source);
            await driver.findElement(webdriver.By.id("run")).click(); 
            //Check run output
            await driver.wait(webdriver.until.elementLocated(webdriver.By.xpath("//*[@id=\"output\"]/pre")));
            //Retrieve output as array
            let vars = await driver.findElements(webdriver.By.xpath("//*[@id=\"output\"]/pre"));
            expect(vars.length).to.deep.eq(expected[1].length+1);
            let results = [];
            for (let i=1; i<expected[1].length+1; i++) {
                results.push(await driver.findElement(webdriver.By.xpath(`//*[@id=\"output\"]/pre[${i}]`)).getText());
            }
            expect(results).to.deep.eq(expected[0]);
        }
        //Verify the result of running repl
        for(let i=0; i<repls.length; i++){
            if (emptyStatement(repls[i])) continue;
            //Get prev output number
            let outputCount = (await driver.findElements(webdriver.By.xpath("//*[@id=\"output\"]/pre"))).length;
            //Send and run repl
            await driver.findElement(webdriver.By.id("next-code")).sendKeys(repls[i]);
            await driver.findElement(webdriver.By.id("next-code")).sendKeys(webdriver.Key.ENTER);
            
            //Retrieve 
            let varLength = (await driver.findElements(webdriver.By.xpath("//*[@id=\"output\"]/pre"))).length;
            expect(varLength-outputCount).to.deep.eq(expected[i+1].length+1);
            let results = [];
            for (let j=1; j<expected[i+1].length+1; j++) {
                results.push(await driver.findElement(webdriver.By.xpath(`//*[@id=\"output\"]/pre[${j+outputCount}]`)).getText());
            }
            expect(results).to.deep.eq(expected[i+1]);
        }
        
    });
}


