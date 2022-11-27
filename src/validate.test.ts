import {
    getFhirClientJSON, isIgnore, testFile
} from "./common.js";
import * as fs from "fs";
import {describe, expect, jest} from "@jest/globals";
import axios, {AxiosInstance} from "axios";

// Initial terminology queries can take a long time to process - cached responses are much more responsive
jest.setTimeout(40*1000)


const args = require('minimist')(process.argv.slice(2))
    //const args = process.argv

    let source = '../'
    let examples: string

    let isUKCore = false

    let failOnWarning = false;

    if (args!= undefined) {
        if (args['source']!= undefined) {
            source = args['source'];

        }
        if (args['examples']!= undefined) {
            examples = args['folder'];
            source = '../'
        }
    }

    const resource: any = fs.readFileSync(source + '/package.json', 'utf8')
    if (resource != undefined) {
        let pkg= JSON.parse(resource)
        if (pkg.name.startsWith('fhir.r4.ukcore') || pkg.name.startsWith('UKCore')) {
            isUKCore = true;
            console.log('Is UKCore');
        }
        if (pkg.dependencies != undefined) {
            for (let key in pkg.dependencies) {
                if (key.startsWith('fhir.r4.ukcore')) {
                    failOnWarning = true;
                    console.log('ukcore dependency found, enabled STRICT validation')
                }
            }
        }
    }

    describe('Test Environment', ()=> {
        let client: AxiosInstance;
        beforeAll(async () => {
            client = await getFhirClientJSON();
        });
        test('Validator is functioning ', async function () {

            const result = await client.get('/metadata')
            expect(result.status).toEqual(200)

        })
    });

    console.log('Current directory - ' + __dirname)

    // Main body of the tests
    testFolderAll(source )




function testFolderAll(dir) {

    if (fs.existsSync(dir)) {
        const list = fs.readdirSync(dir);
        list.forEach(function (fileTop) {
            if (fs.lstatSync(source+fileTop).isDirectory()) {

                describe(fileTop,() => {
                    const list = fs.readdirSync(dir + fileTop);
                    let runTest = !isIgnore(fileTop)

                    if (runTest) {
                        list.forEach(function (file) {
                            let processFile = !isIgnore(file)
                           // if (file.includes('.DS_Store')) processFile = false;
                          //  if (file.startsWith('.')) processFile = false;
                            if (processFile) {
                                if (!fs.lstatSync(source + fileTop+ "/" + file).isDirectory()) {
                                    testFile(dir, fileTop, file, failOnWarning, isUKCore)
                                }
                            }
                        })
                    }
                })
            }
        });
    }
}









