'use client'

// UGLY
// const loadTransformersPackage = () => {
//     return new Promise((resolve, reject) => {
//       if (!self.__Transformers) {
//         const script = document.createElement('script');
//         script.src = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0';
//         script.onload = () => {
//           self.__Transformers = someGlobalVariableDefinedByTheScript; // Adjust based on the global variable set by the script
//           resolve(self.__Transformers);
//         };
//         script.onerror = () => {
//           reject(new Error('Script loading failed'));
//         };
//         document.head.appendChild(script);
//       } else {
//         resolve(self.__Transformers);
//       }
//     });
// };
// importScripts('https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js')
// importScripts('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.5.4/dist/transformers.min.js')
// console.log('Loading test.js')
// importScripts('/test.js')
// console.log('Loaded test.js')



// Use the Singleton pattern to enable lazy construction of the pipeline.
class PipelineSingleton {
    static task = 'feature-extraction';
    static model = 'Supabase/gte-small';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            console.log('Loading transformers package.')
            // const transformers = await loadTransformersPackage();
            // Skip local model check
            const {
                env,
                pipeline,
            } = await import("@xenova/transformers");
            
            env.allowLocalModels = false;
            this.instance = pipeline(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
    // Retrieve the classification pipeline. When called for the first time,
    // this will load the pipeline and save it for future use.
    let vectorizer = await PipelineSingleton.getInstance(x => {
        // We also add a progress callback to the pipeline so that we can
        // track model loading.
        self.postMessage(x);
    });

    if (event.data.type === 'vectorize'){
        // Actually perform the classification
        let output = await vectorizer(event.data.text, {
            pooling: "mean",
            normalize: true,
        });

        // Send the output back to the main thread
        self.postMessage({
            id: event.data.id,
            type: 'vectorize',
            status: 'complete',
            output: Array.from(output.data),
        });
    }
    else {
        throw new Error('Unknown message type');
    }
});