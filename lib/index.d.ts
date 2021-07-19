
/**
 * @module watson-assistant-experiment
 */

declare class Assistant {
    /**
     * Construct an Assistant object.
     * @constructor
     */
    constructor(options: AssistantOptions)
    /**
     * Execute experiment
     */
    runExperiment(options: RunExperimentOptions): Promise<ExperimentResults>
}

interface AssistantOptions {
    url: string
    targetURL: string
    version: string
    apikey: string
    targetApikey: string
    
    NUM_FOLDS?: Number
    VERBOSE?: Number
    SEED?: Number
    BATCH_SIZE?: Number
    THROTTLE?: Number
    POLLING_INTERVAL?: Number
}

interface RunExperimentOptions {
    workspace_id: string
}

interface Class {
    class: string
    confidence: number
}

interface ExperimentResults {
    predictions: {
        input: any
        true_class: string
        output: Class[]
    }[]
    reports: {
        class_distribution: {
            class: string
            count: number
        }[]
        precision_at_k: {
            k: number,
            precision: number
        }[]
        class_accuracy: {
            class: string
            count: number
            k: number
            precision: number
        }[]
        pairwise_class_errors: {
            true_class: string
            predicted_class: string
            count: number
            avg_confidence: number
            errors: {
                predicted_class: string
                confidence: number
                input: any
            }[]
        }[]
        accuracy_vs_coverage: {
            confidence_threshold: number
            accuracy: number
            coverage: number
        }[]
    }
}

export = Assistant