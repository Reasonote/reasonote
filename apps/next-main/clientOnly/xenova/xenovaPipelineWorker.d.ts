


export type XenovaPipelineWorkerInputEvents = "vectorize" | "match";

export type XenovaPipelineWorkerOutputEvents = "vectorize" | "match";


export type EmbeddingPipelineWorkerInput = {
    type: "vectorize";
    text: string;
}

export type EmbeddingPipelineWorkerOutput = {
    type: "vectorize";
    status: string;
    output: number[];
}