<h1 align="center">marcao-wa-experiment</h1>
<p>
  <a href="https://www.npmjs.com/package/marcao-wa-experiment" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/marcao-wa-experiment.svg">
  </a>
  <a href="#" target="_blank">
    <img alt="License: ISC" src="https://img.shields.io/badge/License-ISC-yellow.svg" />
  </a>
  <a href='https://coveralls.io/github/MarcoABCardoso/marcao-wa-experiment?branch=master'>
    <img src='https://coveralls.io/repos/github/MarcoABCardoso/marcao-wa-experiment/badge.svg?branch=master' alt='Coverage Status' />
  </a>
  <a href="#" target="_blank">
    <img alt="Node.js CI" src="https://github.com/MarcoABCardoso/marcao-wa-experiment/workflows/Node.js%20CI/badge.svg" />
  </a>
</p>

> Runs K-Fold cross validation on Watson Assistant Skill.

## Install

```sh
npm install -g marcao-wa-experiment
```

## Usage

CLI:
```sh
> marcao-wa-experiment

Marcão Experiment Script

  Runs K-Fold cross validation on Watson Assistant Skill. 

Options

  -h, --help                  Print usage instructions.                         
  -a, --apikey string         Watson Assistant API Key.                         
  -w, --workspace_id string   Watson Assistant workspace ID.                    
  -u, --url string            Watson Assistant base URL.                        
  -n, --num_folds number      Number of folds. Default: 3                       
  -v, --version string        Watson Assistant API version. Default: 2020-07-01 
  -o, --output string         Output file. Default: results.json                

Output

  Experiment results in JSON format
```

As a module:
```js
const Assistant = require('marcao-wa-experiment')
const assistant = new Assistant({ 
  version: '2020-07-01', 
  apikey: 'YOUR_WATSON_ASSISTANT_API_KEY', 
  url: 'YOUR_WATSON_ASSISTANT_SERVICE_URL'
})

let results = await assistant.runExperiment({ workspace_id: 'TARGET_WORKSPACE_ID' })
```

## Run tests

```sh
npm run test
```

## Author

👤 **Marco Cardoso**

* Github: [@MarcoABCardoso](https://github.com/MarcoABCardoso)
* LinkedIn: [@marco-cardoso](https://linkedin.com/in/marco-cardoso)

## Show your support

Give a ⭐️ if this project helped you!