import {basePath, defaultBaseUrl, downloadPackage, getJson, getPatient, resourceChecks} from "./common.js";

import * as fs from "fs";
import supertest from "supertest"
import {jest} from "@jest/globals";
import {tsTupleType} from "@babel/types";

const args = require('minimist')(process.argv.slice(2))
//const args = process.argv

let source = '../'
let examples: string

let failOnWarning = false;



if (args!= undefined) {
    if (args['source']!= undefined) {
        source = args['source'];

    }
    if (args['examples']!= undefined) {
        examples = args['folder'];
    }
}


it('Validator is functioning ',async function () {
    await client().get('/metadata').expect(200)
});


const client = () => {
    const url = defaultBaseUrl
    return supertest(url)
}

const resource: any = fs.readFileSync(source + '/package.json', 'utf8')
if (resource != undefined) {
    let pkg= JSON.parse(resource)

    if (pkg.dependencies != undefined) {
        for (let key in pkg.dependencies) {
            if (key.startsWith('fhir.r4.ukcore')) {
                failOnWarning = true;
                console.log('ukcore dependency found, enabled STRICT validation')
            }
        }
    }
}

async function validateFHIR(fhirResource: any) {

}

function testFolderAll(dir) {

    if (fs.existsSync(dir)) {
        const list = fs.readdirSync(dir);
        list.forEach(function (fileTop) {
            if (fs.lstatSync(source+fileTop).isDirectory()) {
                const list = fs.readdirSync(dir + fileTop);
                let runTest = true
                if (fileTop.startsWith('.')) runTest = false;
                if (fileTop == 'Diagrams') runTest = false;
                if (fileTop == 'Diagams') runTest = false;
                if (fileTop == 'FML') runTest = false;
                if (fileTop == 'dist') runTest = false;
                if (fileTop == 'documents') runTest = false;
                if (fileTop == 'nhsdtheme') runTest = false;
                if (fileTop == 'ukcore') runTest = false;
                if (fileTop == 'apim') runTest = false;
                if (fileTop == 'Supporting Information') runTest = false;
                if (runTest) {
                    list.forEach(function (file) {
                        let processFile = true
                        if (file.includes('.DS_Store')) processFile = false;
                        if (file.startsWith('.')) processFile = false;
                        if (processFile) {
                                file = dir + fileTop + "/" + file;
                            let resource: any = undefined
                            try {
                                resource = fs.readFileSync(file, 'utf8');
                            } catch (e) {
                                console.log('Error reading ' + file + ' Error message ' + (e as Error).message)
                            }
                            // Initial terminology queries can take a long time to process - cached responses are much more responsive
                            jest.setTimeout(40000)

                            let fhirResource = getJson(file, resource)
                            let validate = true
                            try {
                                let json = JSON.parse(fhirResource)
                                if (json.resourceType == "StructureDefinition") {
                                    if (json.kind == "logical") {
                                        // skip for now
                                        validate = false
                                    }
                                }
                            } catch (e) {
                                console.log('Error processing ' + file + ' exception ' + (e as Error).message)
                                validate = false
                            }

                            if (validate) {
                                var fileExtension = file.split('.').pop();
                                if (fileExtension == 'xml' || fileExtension == 'XML') {
                                    it('Validate ' + file, async () => {

                                            await client()
                                                .post('/$validate')
                                                .retry(3)
                                                .set("Content-Type", 'application/fhir+xml')
                                                .set("Accept", 'application/fhir+json')
                                                .send(resource)
                                                // .expect(200)
                                                .then((response: any) => {
                                                        resourceChecks(response, failOnWarning)
                                                    },
                                                    error => {

                                                        if (!error.message.includes('Async callback was not invoked within the')) throw new Error(error.message)
                                                    }
                                                )
                                        }
                                    )
                                } else {
                                    it('Validate ' + file, async () => {

                                            await client()
                                                .post('/$validate')
                                                .retry(3)
                                                .set("Content-Type", 'application/fhir+json')
                                                .set("Accept", 'application/fhir+json')
                                                .send(fhirResource)
                                                .expect(200)
                                                .then((response: any) => {
                                                        resourceChecks(response, failOnWarning)
                                                    },
                                                    error => {

                                                        if (!error.message.includes('Async callback was not invoked within the')) throw new Error(error.message)
                                                    }
                                                )
                                        }
                                    )
                                }
                            }
                        }
                    });
                }
            }
        })
    }
}

function testFolder(dir) {

    if (fs.existsSync(dir)) {
        const list = fs.readdirSync(dir);
        list.forEach(function (file) {
            if (file.includes('.DS_Store')) return;
            file = dir + "/" + file;
            const resource: any = fs.readFileSync(file, 'utf8');
              // Initial terminology queries can take a long time to process - cached responses are much more responsive
            jest.setTimeout(40000)

                let fhirResource = getJson(file, resource)
                let json = JSON.parse(fhirResource)
                let validate = true
                if (json.resourceType == "StructureDefinition") {
                    if (json.kind == "logical") {
                        // skip for now
                        validate = false
                    }
                }
                if (validate) {
                    var fileExtension = file.split('.').pop();
                    if (fileExtension == 'xml' || fileExtension == 'XML') {
                        it('Validate ' + file, async () => {

                                await client()
                                    .post('/$validate')
                                    .retry(3)
                                    .set("Content-Type", 'application/fhir+xml')
                                    .set("Accept", 'application/fhir+json')
                                    .send(resource)
                                   // .expect(200)
                                    .then((response: any) => {
                                            resourceChecks(response, failOnWarning)
                                        },
                                        error => {

                                            if (!error.message.includes('Async callback was not invoked within the')) throw new Error(error.message)
                                        }
                                    )
                            }
                        )
                    } else {
                        it('Validate ' + file, async () => {

                                await client()
                                    .post('/$validate')
                                    .retry(3)
                                    .set("Content-Type", 'application/fhir+json')
                                    .set("Accept", 'application/fhir+json')
                                    .send(fhirResource)
                                    .expect(200)
                                    .then((response: any) => {
                                            resourceChecks(response, failOnWarning)
                                        },
                                        error => {

                                            if (!error.message.includes('Async callback was not invoked within the')) throw new Error(error.message)
                                        }
                                    )
                            }
                        )
                    }
                }
        });
    }
}

    describe('Testing folder resources', () => {
        testFolderAll(source );
     /*
        fs.readdir(source, (err, files) => {
            files.forEach(file => {

                if (fs.lstatSync(source+file).isDirectory()) {

                    let test = true;
                    if (file.startsWith('.') ) test = false

                    if (test) {
                        console.log('Testing '  + source + file);
                      //

                    }
                } else {
                    //console.log('Is a file '  + file)
                }
            });
        });*/
    });

    describe('Parsing supplied folder ', () => {
        if (examples != undefined) testFolder(examples);
    });



// End UK Core folder names
/*
    describe('Testing validation api is functioning', () => {
        console.log(getPatient())
        it('validation functionality test', async () => {
            await client()
                .post('/$validate')
                .set("Content-Type", "application/fhir+json; fhirVersion=4.0.1")
                .set("Accept", "application/fhir+json")
                .send(getPatient())
                .expect(200)
        });
    });
*/




