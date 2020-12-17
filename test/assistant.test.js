const Assistant = require("../lib")
const AssistantV1 = require("ibm-watson/assistant/v1")

let assistantOptions = {
    url: 'foo_url',
    apikey: 'foo_apikey',
    version: 'foo_version',

    THROTTLE: 1,
    POLLING_INTERVAL: 1,
    SEED: 1,
}
let sampleWorkspace = require('./sample-workspace.json')
let sampleResults = require('./sample-results.json')
let v1Mock = {
    getWorkspace: (options) => Promise.resolve({ result: { ...sampleWorkspace, status: 'Available' } }),
    createWorkspace: (options) => Promise.resolve({ result: sampleWorkspace }),
    deleteWorkspace: (options) => Promise.resolve({ result: {} }),
    message: (options) => Promise.resolve({ result: { context: { conversation_id: "foo_conversation_id" }, intents: (sampleResults.predictions.find(p => p.input.text === options.input.text) || { output: [] }).output.map(o => ({ intent: o.class, confidence: o.confidence })) } })
}


beforeEach(() => {
    assistant = new Assistant(assistantOptions)
})

describe('Assistant', () => {
    describe('#constructor', () => {
        let assistant = new Assistant(assistantOptions)
        it('Creates an instance of Assistant', () => {
            expect(assistant).toBeInstanceOf(Assistant)
        })
        it('Sets v1 to an instance of the Watson Assistant V1 SDK with the given parameters', () => {
            expect(assistant.v1).toBeInstanceOf(AssistantV1)
            expect(assistant.v1.baseOptions.url).toBe('foo_url')
            expect(assistant.v1.baseOptions.version).toBe('foo_version')
            expect(assistant.v1.authenticator.apikey).toBe('foo_apikey')
        })
    })

    describe('#runExperiment', () => {
        let assistant = new Assistant(assistantOptions)
        it('Executes K-fold experiment on a workspace', (done) => {
            assistant.v1 = v1Mock
            assistant.runExperiment({ workspace_id: 'foo_workspace_id' })
                .catch(err => done.fail(err))
                .then(results => {
                    expect(results).toEqual(sampleResults)
                    done()
                })
        })
    })


})