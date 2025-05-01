export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}


export function CorsResponse(response: Response) {
    return new Response(response.body, {
        ...response,
        headers: {
            ...corsHeaders,
            ...response.headers,
        },
    })
}