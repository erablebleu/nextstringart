export async function fetchAndThrow(input: string | URL | globalThis.Request, init?: RequestInit): Promise<Response> {
    const response = await fetch(input, init)

    if(response.ok)
        return response

    throw new Error(await response.text())
}