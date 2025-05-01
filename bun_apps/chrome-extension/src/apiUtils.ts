export async function genObject(prompt: string, schema: object) {
    return new Promise((resolve, reject) => {
        console.log("SENDING MESSAGE TO BACKEND");
        chrome.runtime.sendMessage(
            { action: 'genObject', data: { prompt, schema } },
            response => {
                if (response.success) {
                    console.log("GENERATED OBJECT:", response.data);
                    resolve(response.data);
                } else {
                    console.error("Error generating object:", response.error);
                    reject(new Error(response.error));
                }
            }
        );
    });
}