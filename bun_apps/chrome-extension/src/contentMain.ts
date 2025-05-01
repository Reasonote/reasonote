// // contentScript.js
// console.log("Content script loaded.");

const { genObject } = require('./apiUtils');

// // Access the title of the current webpage
// const pageTitle = document.title;

// // contentScript.ts
// function extractHeadings(): string[] {
//     const headings = [];
//     document.querySelectorAll('h1, h2, h3').forEach(el => headings.push(el.textContent || ''));
//     return headings;
// }

// chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
//     console.log("GOT MESSAGE", msg);
//     if (msg.action === 'extractHeadings') {
//         sendResponse(extractHeadings());
//     }
// });

// // Log the title to the console
// console.log("Page title:", pageTitle);


const logger = {
    log: (...args: any[]) => console.log('[RSN_EXT]', ...args),
    error: (...args: any[]) => console.error('[RSN_EXT]', ...args),
    warn: (...args: any[]) => console.warn('[RSN_EXT]', ...args),
    info: (...args: any[]) => console.info('[RSN_EXT]', ...args),
    debug: (...args: any[]) => console.debug('[RSN_EXT]', ...args),
}

logger.log("Content script loaded.");

export function main() {
    logger.debug("main");

    // Ensure this code runs only after the page has fully loaded
    window.addEventListener('load', () => {
        logger.debug('window.load event fired.')
        const authTokenTogether = document.cookie.split('; ')
            .find((row: any) => row.startsWith('supabase-auth-token='))

        const authTokenEncoded = authTokenTogether?.split('=')[1];


        const authTokenInList = authTokenEncoded ? decodeURIComponent(authTokenEncoded) : null;

        // authTokenInList is a string like ["TOKEN_IS_HERE", thing, stuff...]
        // we must extract the token from the string using a regex to match the first
        // things between quotes.
        const authToken = authTokenInList ? authTokenInList.match(/"([^"]+)"/)?.[1] : null;

        logger.log('authToken', authToken);

        // const authToken = localStorage.getItem('AUTH_TOKEN');
        if (authToken) {
            chrome.runtime.sendMessage({ type: 'AUTH_TOKEN', token: authToken });
        }
    });

    // TODO: move to ZOD.
    interface MsgShowPopup {
        type: "SHOW_POPUP";
        text: string;
    }

    function handlePopupMessage(message: MsgShowPopup) {
        // logger.log("RECEIVED_MESSAGE", message);
        // // Create a div element and style it as a popup
        // let popup = document.createElement("div");
        // popup.innerHTML = `
        //     <div style='position:fixed; top: 20px; right: 20px; z-index: 1000; background-color: white; padding: 10px; border: 1px solid black;'>
        //     ${message.text}
        //     </div>
        // `;
        // document.body.appendChild(popup);


        // TRY 2
        logger.log("RECEIVED_MESSAGE", message);

        // Create a div element and style it as a popup
        let popup = document.createElement("div");
        popup.style.position = "fixed";
        popup.style.top = "20px";
        popup.style.right = "20px";
        popup.style.zIndex = "1000";
        popup.style.backgroundColor = "white";
        popup.style.padding = "10px";
        popup.style.border = "1px solid black";

        document.body.appendChild(popup);

        // Fetch the contents of coolstuff.html and inject it into the popup div
        fetch(chrome.runtime.getURL("index.html"))
            .then(response => response.text())
            .then(html => {
                popup.innerHTML = html;

                // Use a relative path within your extension's directory
                const scriptElement = document.createElement('script');
                scriptElement.src = chrome.runtime.getURL('build/index.js');
                popup.appendChild(scriptElement);
            });
    }

    interface MsgAskReasonote {
        type: "ASK_REASONOTE";
    }

    async function handleAskReasonoteMessage(message: MsgAskReasonote) {
        let originalActiveElement: HTMLElement | null = null;
        let text: string;

        // If there's an active text input
        if (
            document.activeElement &&
            (document.activeElement.isContentEditable ||
                document.activeElement.nodeName.toUpperCase() === "TEXTAREA" ||
                document.activeElement.nodeName.toUpperCase() === "INPUT")
        ) {
            // Set as original for later
            originalActiveElement = document.activeElement;
            // Use selected text or all text in the input
            text =
                document.getSelection().toString().trim() ||
                document.activeElement.textContent.trim();
        } else {
            // If no active text input use any selected text on page
            text = document.getSelection().toString().trim();
        }


        alert("text: " + text);

        try {
            const summaryResult = await genObject(`Summarize the following text: ${text}`, {
                type: "object",
                properties: {
                    summary: { type: "string" },
                },
                required: ["summary"]
            });

            alert("summaryResult: " + JSON.stringify(summaryResult, null, 2));
        }
        catch (error) {
            alert("Error: " + error);
        }

        if (!text) {
            alert(
                "No text found. Select this option after right clicking on a textarea that contains text or on a selected portion of text."
            );
            return;
        }

        showLoadingCursor();

        // Send the text to the API endpoint
        fetch("http://localhost:3000", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: text }),
        })
            .then((response) => response.json())
            .then(async (data) => {
                // Use original text element and fallback to current active text element
                const activeElement =
                    originalActiveElement ||
                    (document.activeElement && document.activeElement.isContentEditable && document.activeElement);

                if (activeElement) {
                    if (
                        activeElement.nodeName.toUpperCase() === "TEXTAREA" ||
                        activeElement.nodeName.toUpperCase() === "INPUT"
                    ) {
                        // Insert after selection
                        activeElement.value =
                            activeElement.value.slice(0, activeElement.selectionEnd) +
                            `\n\n${data.reply}` +
                            activeElement.value.slice(
                                activeElement.selectionEnd,
                                activeElement.length
                            );
                    } else {
                        // Special handling for contenteditable
                        const replyNode = document.createTextNode(`\n\n${data.reply}`);
                        const selection = window.getSelection();

                        if (selection && selection.rangeCount === 0) {
                            selection.addRange(document.createRange());
                            selection.getRangeAt(0).collapse(activeElement, 1);
                        }

                        const range = selection?.getRangeAt(0);
                        range?.collapse(false);

                        // Insert reply
                        range?.insertNode(replyNode);

                        // Move the cursor to the end
                        selection?.collapse(replyNode, replyNode.length);
                    }
                } else {
                    // Alert reply since no active text area
                    alert(`ChatGPT says: ${data.reply}`);
                }

                restoreCursor();
            })
            .catch((error) => {
                restoreCursor();
                alert(
                    "Error. Make sure you're running the server by following the instructions on https://github.com/gragland/chatgpt-chrome-extension. Also make sure you don't have an adblocker preventing requests to localhost:3000."
                );
                throw new Error(error);
            });
    }

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        logger.debug("chrome.runtime.onMessage.addListener GOT MESSAGE", message);

        if (message.type === 'SHOW_POPUP') {
            handlePopupMessage(message);
        }
        else if (message.type === 'ASK_REASONOTE') {
            handleAskReasonoteMessage(message);
        }
        else {
            logger.warn('Unknown message type', message.type);
        }
    });


    chrome.runtime.onConnect.addListener((port) => {
        port.onMessage.addListener((message) => {
            logger.debug("port.onMessage.addListener GOT MESSAGE", message);
            if (message.action === "SHOW_POPUP") {
                handlePopupMessage(message);
            }
            else if (message.action === "ASK_REASONOTE") {
                handleAskReasonoteMessage(message);
            }
            else {
                logger.warn('Unknown action', message.action);
            }
        });
    });


    const showLoadingCursor = () => {
        const style = document.createElement("style");
        style.id = "cursor_wait";
        style.innerHTML = `* {cursor: wait;}`;
        document.head.insertBefore(style, null);
    };

    const restoreCursor = () => {
        document.getElementById("cursor_wait").remove();
    };
}