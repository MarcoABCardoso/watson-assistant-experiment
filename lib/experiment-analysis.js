let { mean } = require('simple-statistics')
const _ = require("lodash")

function classDistribution(predictions) {
    let intentHash = _.groupBy(predictions, 'true_intent')
    return Object.keys(intentHash).map(intent => ({ intent: intent, count: intentHash[intent].length }))
}

function precisionAtK(predictions, maxK = 10) {
    return Array(maxK).fill().map((_, i) => i)
        .map(k => predictions.map(r => r.intents.map(i => i.intent).slice(0, k + 1).includes(r.true_intent)))
        .map((hits, k) => ({ k: k, precision: mean(hits) }))
}

function classAccuracy(predictions) {
    let intentHash = _.groupBy(predictions, 'true_intent')
    return Object.keys(intentHash).map(intent => ({
        intent: intent,
        count: intentHash[intent].length,
        ...precisionAtK(intentHash[intent], 1)[0]
    }))
        .sort((a, b) => a.count - b.count)
}

function pairwiseClassErrors(predictions) {
    let intentHash = _.groupBy(predictions, 'true_intent')
    return Object.keys(intentHash)
        .map(key => ({
            true_intent: key,
            errors: _.groupBy(
                intentHash[key]
                    .map(prediction => prediction.intents[0] ? {
                        predicted_intent: prediction.intents[0].intent,
                        confidence: prediction.intents[0].confidence,
                        input: prediction.input
                    } : { predicted_intent: null, confidence: 0, input: prediction.input })
                , 'predicted_intent')
        }))
        .reduce((pwce, item) => [
            ...pwce,
            ...Object.keys(item.errors)
                .filter(key => key !== item.true_intent)
                .map(key => ({
                    true_intent: item.true_intent,
                    predicted_intent: key,
                    count: item.errors[key].length,
                    avg_confidence: mean(item.errors[key].map(p => p.confidence)),
                    errors: item.errors[key]
                }))
        ], [])
        .sort((a, b) => b.count + b.avg_confidence - a.count - a.avg_confidence)
}

function accuracyVsCoverage(predictions, step = 0.1) {
    return Array(1 / step).fill().map((_, i) => i * step)
        .map(confidence_threshold => {
            let highConfidenceErrors = predictions
                .filter(prediction => !prediction.intents[0] || (prediction.intents[0].intent !== prediction.true_intent && prediction.intents[0].confidence >= confidence_threshold))
            let unansweredQuestions = predictions
                .filter(prediction => !prediction.intents[0] || (prediction.intents[0].confidence < confidence_threshold))
            return {
                confidence_threshold,
                accuracy: 1 - highConfidenceErrors.length / predictions.length,
                coverage: 1 - unansweredQuestions.length / predictions.length
            }
        })
}

function generateReports(predictions) {
    return {
        class_distribution: classDistribution(predictions),
        precision_at_k: precisionAtK(predictions),
        class_accuracy: classAccuracy(predictions),
        pairwise_class_errors: pairwiseClassErrors(predictions),
        accuracy_vs_coverage: accuracyVsCoverage(predictions),
    }
}

module.exports = {
    classDistribution,
    precisionAtK,
    classAccuracy,
    pairwiseClassErrors,
    accuracyVsCoverage,

    generateReports
}