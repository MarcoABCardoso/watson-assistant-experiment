const Assistant = require("../lib/assistant")
const AssistantV1 = require("ibm-watson/assistant/v1")

let assistant
let sampleWorkspace = require('./sample-workspace.json')
let sampleFolds = require('./sample-folds.json')
let sampleResults = require('./sample-results.json')
let v1Mock = {
    getWorkspace: (options) => Promise.resolve({ result: sampleWorkspace }),
    createWorkspace: (options) => Promise.resolve({ result: sampleWorkspace }),
    deleteWorkspace: (options) => Promise.resolve({ result: {} }),
}


beforeEach(() => {
    assistant = new Assistant({ url: 'foo_url', apikey: 'foo_apikey', version: 'foo_version' })
})

describe('Assistant', () => {
    describe('#constructor', () => {
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

    describe('#waitUntilTrained', () => {
        it('Calls assistant v1 getWorkspace until status is Available', (done) => {
            assistant.v1.getWorkspace = jest.fn()
                .mockReturnValueOnce(Promise.resolve({ result: { status: 'Training' } }))
                .mockReturnValueOnce(Promise.resolve({ result: { status: 'Training' } }))
                .mockReturnValueOnce(Promise.resolve({ result: { status: 'Available' } }))
            assistant.waitUntilTrained({ workspaceID: 'foo_workspace_id' }, true, 0)
                .then(() => {
                    expect(assistant.v1.getWorkspace).toHaveBeenCalledTimes(3)
                    done()
                })
        })
        it('Calls assistant v1 getWorkspace until status is Available', (done) => {
            assistant.v1.getWorkspace = jest.fn()
                .mockReturnValueOnce(Promise.resolve({ result: { status: 'Training' } }))
                .mockReturnValueOnce(Promise.resolve({ result: { status: 'Training' } }))
                .mockReturnValueOnce(Promise.resolve({ result: { status: 'Available' } }))
            assistant.waitUntilTrained({ workspaceID: 'foo_workspace_id' }, false, 0)
                .then(() => {
                    expect(assistant.v1.getWorkspace).toHaveBeenCalledTimes(3)
                    done()
                })
        })
        it('Does not crash with default parameters', () => {
            assistant.v1.getWorkspace = jest.fn()
            assistant.waitUntilTrained({ workspaceID: 'foo_workspace_id' })
        })
    })

    describe('#getExamples', () => {
        it('Flattens a workspace to retrieve its examples', () => {
            let examples = assistant.getExamples({
                intents: [
                    {
                        intent: 'foo_intent_1', examples: [{ text: 'foo_example_1' }, { text: 'foo_example_2' }]
                    }, {
                        intent: 'foo_intent_2', examples: [{ text: 'foo_example_3' }, { text: 'foo_example_4' }]
                    }]
            })
            expect(examples).toEqual([
                { "intent": "foo_intent_1", "text": "foo_example_1" },
                { "intent": "foo_intent_1", "text": "foo_example_2" },
                { "intent": "foo_intent_2", "text": "foo_example_3" },
                { "intent": "foo_intent_2", "text": "foo_example_4" }
            ])

        })
    })

    describe('#partition', () => {
        it('Splits a workspace into folds, without using train examples for testing', () => {
            let folds = assistant.partition(sampleWorkspace, 3)
            for (let fold of folds) {
                let trainExamples = assistant.getExamples(fold.workspace).map(e => e.text)
                expect(fold.test.length == 66 || fold.test.length == 67)
                expect(trainExamples.length == 132)
                for (let example of fold.test)
                    expect(trainExamples.includes(example.text)).not.toBeTruthy()
            }
        })
    })

    describe('#runTests', () => {
        it('Submits a list of tests to Watson Assistant V1 and returns results', (done) => {
            assistant.v1.message = jest.fn(x => Promise.resolve({ result: { input: x.input, intents: [] } }))
            let tests = [{ "text": "foo_example_1", "intent": "foo_intent_1" }, { "text": "foo_example_3", "intent": "foo_intent_2" }]
            assistant.runTests('foo_workspace_id', tests)
                .then(results => {
                    expect(results).toEqual([{ "input": "foo_example_1", "intents": [], "true_intent": "foo_intent_1" }, { "input": "foo_example_3", "intents": [], "true_intent": "foo_intent_2" }])
                    done()
                })
        })
        it('Verbosity changes nothing', (done) => {
            assistant.v1.message = jest.fn(x => Promise.resolve({ result: { input: x.input, intents: [] } }))
            let tests = [{ "text": "foo_example_1", "intent": "foo_intent_1" }, { "text": "foo_example_3", "intent": "foo_intent_2" }]
            assistant.runTests('foo_workspace_id', tests, true)
                .then(results => {
                    expect(results).toEqual([{ "input": "foo_example_1", "intents": [], "true_intent": "foo_intent_1" }, { "input": "foo_example_3", "intents": [], "true_intent": "foo_intent_2" }])
                    done()
                })
        })
    })

    describe('#runExperiment', () => {
        it('Executes K-fold experiment on a workspace', (done) => {
            assistant.v1 = v1Mock
            assistant.partition = jest.fn(x => sampleFolds)
            assistant.waitUntilTrained = jest.fn(x => Promise.resolve(true))
            assistant.runTests = jest.fn((w_id, tests) => Promise.resolve(sampleResults.predictions.filter(p => tests.map(t => t.text).includes(p.input))))
            assistant.runExperiment('foo_workspace_id', 3)
                .then(results => {
                    expect(results).toEqual(sampleResults)
                    done()
                })
        })
        it('Verbosity changes nothing', (done) => {
            assistant.v1 = v1Mock
            assistant.partition = jest.fn(x => sampleFolds)
            assistant.waitUntilTrained = jest.fn(x => Promise.resolve(true))
            assistant.runTests = jest.fn((w_id, tests) => Promise.resolve(sampleResults.predictions.filter(p => tests.map(t => t.text).includes(p.input))))
            assistant.runExperiment('foo_workspace_id', 3, true)
                .then(results => {
                    expect(results).toEqual(sampleResults)
                    done()
                })
        })
    })


})