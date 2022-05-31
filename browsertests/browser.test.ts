// @ts-nocheck
import * as webdriver from 'selenium-webdriver';
import "mocha";
import { expect } from "chai";
import { doesNotMatch } from 'assert';
import {Options} from 'selenium-webdriver/chrome'
import { count } from 'console';
require('chromedriver');

var driver;
export default driver;
var debug = 0;


before(async function () {
    const opts = new Options();
    if (debug===0) opts.addArguments('--headless', '--no-sandbox')
    
    driver = await new webdriver.Builder().forBrowser("chrome").setChromeOptions(opts).build();
    await driver.get("http://127.0.0.1:8000");
});

afterEach(async function() {
    if (debug===0) await driver.get("http://127.0.0.1:8000");
});

after(async function () {
    if (debug===0) await driver.quit();
});

function emptyStatement(source: string){
    for (let i=0; i<source.length; i++) {
        if (source[i]!==" ") return false;
    }
    return true;
}

function endWithColon(source: string){
    for (let i=source.length-1; i>=0; i--){
        if (source[i]===":") return true;
        else if (source[i]!==" ") return false;
    }
    return false;
}

function countWhiteSpace(source: string){
    count = 0;
    for (let i=0; i<source.length; i++){
        if (source[i]===" ") count++;
        else return count;
    }
    return count;
}

function isEmpty(source: string){
    for (let i=0; i<source.length; i++){
        if (source[i]!==" ") return false; 
    }
    return true;
}

function reverseAutoComplete(source: string){
    let sources = source.split(/\r?\n/);
    let preColon = false;
    let preCount = 0;
    let preReturn = false;
    let reversedString = "";
    for (let i=0; i<sources.length; i++){
        if (isEmpty(sources[i])) continue;
        let count = preCount;
        if (preColon) count += 2;
        if (preReturn) count -= 2;
        for(let j=0; j<count; j++) reversedString += webdriver.Key.BACK_SPACE;
        reversedString += sources[i]+" "+webdriver.Key.ENTER;
        preColon = endWithColon(sources[i]);
        preCount = countWhiteSpace(sources[i]);
        preReturn = sources[i].includes("return");
    }
    return reversedString;
}

export async function assertFileUpload(name:string, source: string, expected: Array<string>) {
    await driver.wait(webdriver.until.elementLocated(webdriver.By.id("user-code")));
    await driver.wait(webdriver.until.elementLocated(webdriver.By.id("user-code")));
    await driver.findElement(webdriver.By.id("load")).click(); 
}

export async function debug(name:string, source: string, expected: Array<string>) {
    it(name, async function () {
        //Send and run source
        await driver.wait(webdriver.until.elementLocated(webdriver.By.id("user-code")));
        await driver.findElement(webdriver.By.id("load")).click(); 
    });
}


export async function assertPrint(name:string, source: string, expected: Array<string>) {
    it(name, async function () {
        //Send and run source
        await driver.wait(webdriver.until.elementLocated(webdriver.By.id("user-code")));
        await driver.findElement(webdriver.By.className("CodeMirror cm-s-default CodeMirror-simplescroll")).click();
        let textAreas = await driver.findElements(webdriver.By.css("textarea"));
        await textAreas[1].sendKeys(reverseAutoComplete(source));
        await driver.findElement(webdriver.By.id("run")).click(); 
        //Check output length is equal to expected
        await driver.wait(webdriver.until.elementLocated(webdriver.By.xpath("//*[@id=\"output\"]/pre")));
        let vars = await driver.findElements(webdriver.By.xpath("//*[@id=\"output\"]/pre"));
        if (vars.length!==expected.length+1 && vars.length!==expected.length){
            expect(0).to.deep.eq(1);
        }
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
        await driver.findElement(webdriver.By.className("CodeMirror cm-s-default CodeMirror-simplescroll")).click();
        let textAreas = await driver.findElements(webdriver.By.css("textarea"));
        await textAreas[1].sendKeys(reverseAutoComplete(source));
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
        await driver.findElement(webdriver.By.className("CodeMirror cm-s-default CodeMirror-simplescroll")).click();
        let textAreas = await driver.findElements(webdriver.By.css("textarea"));
        await textAreas[1].sendKeys(reverseAutoComplete(source));
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
            await driver.findElement(webdriver.By.className("CodeMirror cm-s-default CodeMirror-simplescroll")).click();
            let textAreas = await driver.findElements(webdriver.By.css("textarea"));
            await textAreas[1].sendKeys(reverseAutoComplete(source));
            await driver.findElement(webdriver.By.id("run")).click(); 
            //Check run output
            await driver.wait(webdriver.until.elementLocated(webdriver.By.xpath("//*[@id=\"output\"]/pre")));
            //Retrieve output as array
            let vars = await driver.findElements(webdriver.By.xpath("//*[@id=\"output\"]/pre"));
            if (vars.length!==expected[0].length+1 && vars.length!==expected[0].length){
                expect(0).to.deep.eq(1);
            }
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


