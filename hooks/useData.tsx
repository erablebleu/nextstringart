import { Action } from '@/app/action';
import { fetchAndThrow } from '@/tools/fetch';
import React from 'react';

export function useData<T>(url: string | URL | globalThis.Request, init?: RequestInit): [T | undefined, React.Dispatch<React.SetStateAction<T | undefined>>] {
    const [value, setValue] = React.useState<T>()

    React.useEffect(() => {
        Action.try(async () => {
            const result = await fetchAndThrow(url, { method: 'GET' })
            const data = await result.json()
            setValue(data)
        })
    }, [])

    return [value, setValue]
}