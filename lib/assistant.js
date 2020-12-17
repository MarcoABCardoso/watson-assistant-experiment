const Experiment = require('marcao-kfold')
const { IamAuthenticator } = require('ibm-watson/auth')
const AssistantV1 = require('ibm-watson/assistant/v1')
const groupBy = require('group-by')

module.exports = class Assistant {
    constructor(options) {
        this.v1 = new AssistantV1({
            url: options.url,
            version: options.version,
            authenticator: new IamAuthenticator({ apikey: options.apikey })
        })
        this.options = options
    }

    async runExperiment(options) {
        let context = await this.v1.message({ input: {}, workspaceId: options.workspace_id }).then(response => response.result.context).catch(console.log)
        const experiment = new Experiment({
            exportData: () => this.v1.getWorkspace({ workspaceId: options.workspace_id, _export: true })
                .then(data => data.result.intents.reduce((examples, intent) => [...examples, ...intent.examples.map(e => ({ input: { text: e.text }, class: intent.intent }))], [])),
            trainModel: (train) => this.v1.createWorkspace(this.dataToWorkspace(train)).then(data => ({ ...data.result, id: data.result.workspace_id })),
            checkModelStatus: (model) => this.v1.getWorkspace({ workspaceId: model.workspace_id }).then(data => data.result.status === 'Available'),
            predict: (model, input) => this.v1.message({ workspaceId: model.workspace_id, input: input, alternateIntents: true, context }).then(data => data.result.intents.map(intent => ({ class: intent.intent, confidence: intent.confidence }))),
            deleteModel: (model) => this.v1.deleteWorkspace({ workspaceId: model.workspace_id }),
            ...this.options,
        })
        return experiment.run()
    }

    dataToWorkspace(train) {
        let grouped = groupBy(train, 'class')
        return {
            name: "Experiment Workspace",
            intents: Object.keys(grouped).map(key => ({ intent: key, examples: grouped[key].map(e => e.input) }))
        }
    }
}