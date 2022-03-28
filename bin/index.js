#!/usr/bin/env node

const commandLineArgs = require('command-line-args')
const commandLineUsage = require('command-line-usage')
const Assistant = require('../lib')
const fs = require('fs')

async function main() {
    const assistant = new Assistant({ ...options, verbose: true })
    let results = await assistant.runExperiment(options)
    fs.writeFileSync(options.output, JSON.stringify(results, null, 4))
}

let args = [
    { name: 'help', alias: 'h', type: Boolean, defaultValue: false, description: 'Print usage instructions.' },
    { name: 'apikey', alias: 'a', type: String, description: 'Watson Assistant API Key.' },
    { name: 'workspace_id', alias: 'w', type: String, description: 'Watson Assistant workspace ID.' },
    { name: 'url', alias: 'u', type: String, description: 'Watson Assistant base URL.' },
    { name: 'num_folds', alias: 'n', type: Number, defaultValue: 3, description: 'Number of folds. Default: 3' },
    { name: 'version', alias: 'v', type: String, defaultValue: '2020-07-01', description: 'Watson Assistant API version. Default: 2020-07-01' },
    { name: 'output', alias: 'o', type: String, defaultValue: 'results.json', description: 'Output file. Default: results.json' },
]
const sections = [
    { header: 'Watson Assistant Experiment Script', content: 'Runs K-Fold cross validation on Watson Assistant Skill.' },
    { header: 'Options', optionList: args },
    { header: 'Output', content: 'Experiment results in JSON format' },
]
const options = commandLineArgs(args)

if (options.help || (
    !options.apikey ||
    !options.workspace_id ||
    !options.url
))
    console.log(commandLineUsage(sections))
else
    main()