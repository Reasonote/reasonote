// import React, {
//   useEffect,
//   useRef,
//   useState,
// } from "react";

// import {
//   SandpackPreview,
//   SandpackProvider,
// } from "@codesandbox/sandpack-react";
// import {
//   Button,
//   Paper,
// } from "@mui/material";

// const SandpackCommunicationExample = () => {
//     const [messageFromSandpack, setMessageFromSandpack] = useState('');

//     useEffect(() => {
//         const handleMessage = (event) => {
//             console.log('message received', event);
//             // Perform security checks here
//             if (event.origin.endsWith('codesandbox.io') && event.data && event.data.type === 'codesandbox-sandpack-message') {
//                 setMessageFromSandpack(event.data);
//             }
//         };

//         window.addEventListener('message', handleMessage);

//         // Clean up the event listener
//         return () => {
//             window.removeEventListener('message', handleMessage);
//         };
//     }, []);

//     const sandpackRef = useRef<any>(null);

//     const sendMessageToSandpack = (message) => {
//         const iframe = sandpackRef.current?.querySelector('iframe');
//         if (iframe && iframe.contentWindow) {
//             iframe.contentWindow.postMessage(message, '*');
//         }
//     };

//     return (
//         <Paper sx={{width: '100%'}}>
//             <Button onClick={() => {
//                 sendMessageToSandpack({
//                     type: 'codesandbox-message-from-parent',
//                     message: 'Hello from the main app!',
//                 });
//             }}>
//                 Send Message to Sandpack
//             </Button>

//             <div ref={sandpackRef}>
//                 {/* @ts-ignore - (SandpackProvider is not typed correctly) */}
//                 <SandpackProvider
//                     template="react"
//                     files={{
//                         '/App.js': {
//                             code: `
//                             import React, { useState, useEffect } from 'react';
                            
//                             export default function App() {
//                                 const [messageFromParent, setMessageFromParent] = useState('');

//                                 useEffect(() => {
//                                     const handleMessage = (event) => {
//                                         // Perform security checks here
//                                         if (event.data && event.data.type === 'codesandbox-message-from-parent') {
//                                             console.log('Message from parent:', event.data);
//                                             setMessageFromParent(event.data);
//                                         }
//                                     };
                                
//                                     window.addEventListener('message', handleMessage);
                                
//                                     // Clean up the event listener
//                                     return () => {
//                                         window.removeEventListener('message', handleMessage);
//                                     };
//                                 }, []);

//                                 const sendMessage = () => {
//                                     window.parent.postMessage({
//                                         type: 'codesandbox-sandpack-message',
//                                         message: 'Hello from the sandbox!',
//                                     }, '*');
//                                 };

//                                 return <div>
//                                     <button onClick={sendMessage}>Send Message</button>
//                                     <p>Message from parent: {JSON.stringify(messageFromParent)}</p>
//                                 </div>;
//                             }`,
//                         },
//                     }}
//                 >
//                     {/* @ts-ignore - Not typed correctly? */}
//                     <SandpackPreview />
//                 </SandpackProvider>
//             </div>
//             <p>Message from Sandpack: {JSON.stringify(messageFromSandpack)}</p>
//         </Paper>
//     );
// };

// export default SandpackCommunicationExample;

export default function SandpackCommExample() {
  return <div>Not Implemented</div>
}