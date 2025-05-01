'use client'
import {useCallback} from "react";

import _ from "lodash";

import {GetEmbeddingRoute} from "@/app/api/internal/get_embedding/routeSchema";

export function useVectorizer(){
    return {
        ready: true,
        vectorize: useCallback(async (text) => {
            const resp = await GetEmbeddingRoute.call({
                text
            })

            if (resp.error){
                throw new Error(resp.error)
            }

            if (!resp.data){
                throw new Error("No data returned")
            }

            return {
                type: 'vectorize',
                status: 'complete',
                output: resp.data.embedding,
            }
        }, []),
    }
}


// export function useVectorizer(){
//     const worker = useRef<null | any>(null);
//     const receivedMessages = useRef<any[]>([]);
//     const [ready, setReady] = useState<boolean | null>(null);
    
//     // TODO: This should be an app-wide provider,
//     // And we should have some kind of job queue thing we can do.
//     // We use the `useEffect` hook to set up the worker as soon as the `App` component is mounted.
//     useEffect(() => {
//       if (!worker.current) {
//         // Create the worker if it does not yet exist.
//         worker.current = new Worker(new URL('../xenova/xenovaPipelineWorker.js', import.meta.url), {
//           type: 'module'
//         });
//       }
  
//       // Create a callback function for messages from the worker thread.
//       const onMessageReceived = (e) => {
//         switch (e.data.status) {
//           case 'initiate':
//             setReady(false);
//             break;
//           case 'ready':
//             setReady(true);
//             break;
//           case 'complete':
//             receivedMessages.current.push(e.data)
//             break;
//         }
//       };
  
//       // // Attach the callback function as an event listener.
//       worker.current.addEventListener('message', onMessageReceived);
  
//       // // Define a cleanup function for when the component is unmounted.
//       return () => worker.current.removeEventListener('message', onMessageReceived);
//     });
    
//     return {
//       ready,
//       vectorize: useCallback(async (text) => {
//         if (worker.current) {
//           const id = _.uniqueId('vectorize-');
  
//           worker.current.postMessage({ 
//             id,
//             type: 'vectorize', 
//             text 
//           });
  
//           const result = await tryUntilAsync({
//             func: () => {
//               // See if there is anything in the received messages
//               const ret = receivedMessages.current.find((m) => m.id === id);
  
//               if (ret === null || ret === undefined){
//                 throw new Error("Not ready yet")
//               }
  
//               return ret;
//             },
//             delay: {
//               ms: 100,
//             },
//             tryLimits: {
//               maxTimeMS: 2000,
//             }
//           })
  
//           return result; 
//         }
//         else {
//           console.error("Worker not ready")
//         }
//       }, []),
//     }
//   }