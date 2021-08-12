const Assistant = require('../lib')
const AssistantV1 = require('ibm-watson/assistant/v1')

let assistantOptions1 = {
    url: 'foo_url',
    apikey: 'foo_apikey',
    version: 'foo_version',

    throttle: 1,
    polling_interval: 1,
    seed: 1,
}
let assistantOptions2 = {
    url: 'foo_url',
    apikey: 'foo_apikey',
    targetURL: 'foo_url_2',
    targetApikey: 'foo_apikey_2',
    version: 'foo_version',
}
let sampleWorkspace = require('./sample-workspace.json')
let sampleResults = require('./sample-results.json')
let v1Mock = {
    getWorkspace: () => Promise.resolve({ result: { ...sampleWorkspace, status: 'Available' } }),
    createWorkspace: () => Promise.resolve({ result: sampleWorkspace }),
    deleteWorkspace: () => Promise.resolve({ result: {} }),
    message: (options) => Promise.resolve({ result: { context: { conversation_id: 'foo_conversation_id' }, intents: (sampleResults.predictions.find(p => p.input.text === options.input.text) || { output: [] }).output.map(o => ({ intent: o.class, confidence: o.confidence })) } })
}

function compareResults(r1, r2) {
    for (let p1 of r1.predictions)
        if (!r2.predictions.find(p2 => JSON.stringify(p2) === JSON.stringify(p1))) return false
    for (let report in r1.reports)
        for (let row1 of r1.reports[report])
            if (report === 'pairwise_class_errors') {
                let row2 = r2.reports[report].find(row2 => JSON.stringify({ ...row1, errors: undefined }) === JSON.stringify({ ...row2, errors: undefined }))
                if (!row2) return false
                for (let e1 of row1.errors)
                    if (!row2.errors.find(e2 => JSON.stringify(e1) === JSON.stringify(e2))) return false
            }
            else if (!r2.reports[report].find(row2 => JSON.stringify(row1) === JSON.stringify(row2))) return false
    return true
}

describe('Assistant', () => {
    describe('#constructor', () => {
        describe('When no target credentials is passed', () => {
            let assistant = new Assistant(assistantOptions1)
            it('Creates an instance of Assistant using one instance', () => {
                expect(assistant).toBeInstanceOf(Assistant)
            })
            it('Sets v1 to an instance of the Watson Assistant V1 SDK with the given parameters', () => {
                expect(assistant.targetV1).toBeInstanceOf(AssistantV1)
                expect(assistant.targetV1.baseOptions.url).toBe('foo_url')
                expect(assistant.targetV1.baseOptions.version).toBe('foo_version')
                expect(assistant.targetV1.authenticator.apikey).toBe('foo_apikey')
                expect(assistant.v1).toBeInstanceOf(AssistantV1)
                expect(assistant.v1.baseOptions.url).toBe('foo_url')
                expect(assistant.v1.baseOptions.version).toBe('foo_version')
                expect(assistant.v1.authenticator.apikey).toBe('foo_apikey')
            })
        })
        describe('When target credentials is passed', () => {
            let assistant = new Assistant(assistantOptions2)
            it('Creates an instance of Assistant using a different instance for source and target', () => {
                expect(assistant).toBeInstanceOf(Assistant)
            })
            it('Sets v1 to an instance of the Watson Assistant V1 SDK with the given parameters', () => {
                expect(assistant.targetV1).toBeInstanceOf(AssistantV1)
                expect(assistant.targetV1.baseOptions.url).toBe('foo_url_2')
                expect(assistant.targetV1.baseOptions.version).toBe('foo_version')
                expect(assistant.targetV1.authenticator.apikey).toBe('foo_apikey_2')
                expect(assistant.v1).toBeInstanceOf(AssistantV1)
                expect(assistant.v1.baseOptions.url).toBe('foo_url')
                expect(assistant.v1.baseOptions.version).toBe('foo_version')
                expect(assistant.v1.authenticator.apikey).toBe('foo_apikey')
            })
        })
    })

    describe('#runExperiment', () => {
        let assistant = new Assistant(assistantOptions1)
        it('Executes K-fold experiment on a workspace', (done) => {
            assistant.v1 = v1Mock
            assistant.targetV1 = v1Mock
            assistant.runExperiment({ workspace_id: 'foo_workspace_id' })
                .catch(err => console.log(err))
                .then(results => {
                    expect(compareResults(results, sampleResults)).toBe(true)
                    done()
                })
        })
    })

})