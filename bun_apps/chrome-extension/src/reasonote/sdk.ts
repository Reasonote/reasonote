
export const ReasonoteSDK = {
    genObject: async () => {
        const resp = await fetch('https://reasonote.com/api/ai/serve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                function: 'genObject',
                args: {
                    prompt: 'Say Hi',
                    schema: {
                        type: "object",
                        properties: {
                            greeting: { type: "string" },
                            timestamp: { type: "number" },
                            isHappy: { type: "boolean" }
                        },
                        required: ["greeting", "timestamp"]
                    }
                }
            })
        });

        const jsonData = await resp.json();
        return jsonData;
    }
}