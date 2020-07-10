const { IamAuthenticator } = require('ibm-watson/auth')
const AssistantV1 = require('ibm-watson/assistant/v1')
const _ = require('lodash')
const { pollingAwait } = require('./utils')
const { generateReports } = require('./experiment-analysis')

const BATCH_SIZE = 10
const THROTTLE = 1000
const POLLING_INTERVAL = 10000

module.exports = class Assistant {
    constructor(options) {
        this.v1 = new AssistantV1({
            url: options.url,
            version: options.version,
            authenticator: new IamAuthenticator({ apikey: options.apikey })
        })
    }

    /**
     * Promise that resolves when a workspace is done training
     * @param {string} workspaceID 
     */
    waitUntilTrained(workspaceID, verbose = false, interval = POLLING_INTERVAL) {
        if (verbose) console.log(`[MARCAO-WA-EXPERIMENT] [${workspaceID}] TRAINING`)
        return pollingAwait(() =>
            this.v1.getWorkspace({ workspaceId: workspaceID })
                .then(data => {
                    if (verbose) console.log(`[MARCAO-WA-EXPERIMENT] [${workspaceID}] STATUS: ${data.result.status}`)
                    return data.result.status === 'Available'
                }),
            interval
        )
    }

    /**
     * Returns an array of the workspace's examples
     * @param {Object} workspace 
     */
    getExamples(workspace) {
        return workspace.intents
            .reduce((examples, intent) => [
                ...examples,
                ...intent.examples.map(e => ({ ...e, intent: intent.intent }))], [])
    }

    /**
     * Splits a workspace into K folds for cross-validation
     * @param {string} workspaceID 
     * @param {number} numFolds
     * @returns array of folds
     */
    partition(workspace, numFolds) {
        let examples = _.shuffle(this.getExamples(workspace))

        let folds = examples
            .reduce((exampleGroups, example, i) => exampleGroups
                .map((f, j) => i % numFolds === j ? { train: f.train, test: f.test.concat(example) } : { train: f.train.concat(example), test: f.test }),
                Array(numFolds).fill({ train: [], test: [] })
            )

        let intentGroups = folds
            .map(fold => ({
                train: _.groupBy(fold.train, 'intent'),
                test: fold.test,
            }))
            .map(groupedFold => ({
                train: Object.keys(groupedFold.train).map(key => ({ intent: key, examples: groupedFold.train[key] })),
                test: groupedFold.test,
            }))

        let workspaces = intentGroups
            .map(group => ({
                workspace: {
                    ...workspace,
                    intents: group.train
                },
                test: group.test
            }))

        return workspaces
    }

    /**
     * Runs a set of tests against a workspace
     * @param {string} workspaceID 
     * @param {Array} tests 
     */
    async runTests(workspaceID, tests, verbose = false) {
        if (verbose) console.log(`[MARCAO-WA-EXPERIMENT] [${workspaceID}] STARTING TESTS`)
        let allResponses = []
        for (let i = 0; i < tests.length; i += BATCH_SIZE) {
            if (verbose) console.log(`[MARCAO-WA-EXPERIMENT] [${workspaceID}] STARTING BATCH ${i} - ${i + BATCH_SIZE}`)
            let batch = tests.slice(i, i + BATCH_SIZE)
            let responses = await Promise.all(
                batch.map(example =>
                    this.v1.message({
                        workspaceId: workspaceID,
                        input: { text: example.text },
                        alternateIntents: true
                    })
                        .then(r => ({
                            input: r.result.input.text,
                            true_intent: example.intent,
                            intents: r.result.intents
                        }))
                )
            )
            allResponses = [...allResponses, ...responses]
            if (verbose) console.log(`[MARCAO-WA-EXPERIMENT] [${workspaceID}] FINISHED BATCH ${i} - ${i + BATCH_SIZE}`)
            await new Promise(r => setTimeout(() => r(), THROTTLE))
        }
        return allResponses
    }

    /**
     * 
     * @param {string} workspaceID 
     * @param {number} numFolds 
     */
    async runExperiment(workspaceID, numFolds, verbose = false) {
        if (verbose) console.log(`[MARCAO-WA-EXPERIMENT] STARTING EXPERIMENT`)
        if (verbose) console.log(`[MARCAO-WA-EXPERIMENT] EXPORTING WORKSPACE`)
        let workspace = (await this.v1.getWorkspace({ workspaceId: workspaceID, _export: true })).result
        let folds = this.partition(workspace, numFolds)
        if (verbose) console.log(`[MARCAO-WA-EXPERIMENT] TRAINING TEMPORARY WORKSPACES`)
        let trainWorkspaces = await Promise.all(folds.map(fold => this.v1.createWorkspace(fold.workspace).then(data => data.result)))
        let results = {}
        try {
            if (verbose) console.log(`[MARCAO-WA-EXPERIMENT] WAITING FOR TEMPORARY WORKSPACES TO TRAIN`)
            await Promise.all(trainWorkspaces.map(workspace => this.waitUntilTrained(workspace.workspace_id, verbose)))
            if (verbose) console.log(`[MARCAO-WA-EXPERIMENT] ALL TEMPORARY WORKSPACES DONE TRAINING`)
            let predictions = (await Promise.all(trainWorkspaces.map((workspace, i) => this.runTests(workspace.workspace_id, folds[i].test, verbose))))
                .reduce((predictions, foldPredictions) => [...predictions, ...foldPredictions], [])
            if (verbose) console.log(`[MARCAO-WA-EXPERIMENT] GENERATING REPORTS`)
            results = {
                predictions,
                reports: generateReports(predictions)
            }
        } catch (err) { }
        if (verbose) console.log(`[MARCAO-WA-EXPERIMENT] DELETING TEMPORARY WORKSPACES`)
        await Promise.all(trainWorkspaces.map(workspace => this.v1.deleteWorkspace({ workspaceId: workspace.workspace_id })))
        if (verbose) console.log(`[MARCAO-WA-EXPERIMENT] ALL DONE`)
        return results
    }

}