import { Action } from '@/app/action';
import { fetchAndThrow } from '@/tools/fetch';
import { enqueueSnackbar } from 'notistack';
import React from 'react';

export function useAppBar<T>(url: string | URL | globalThis.Request, init?: RequestInit): [T | undefined, React.Dispatch<React.SetStateAction<T | undefined>>] {
    const [value, setValue] = React.useState<T>()

    React.useEffect(() => {
        Action.try(async () => {
            const result = await fetchAndThrow(url, { method: 'GET' })
            const data = await result.json()
            setValue(data)
        })
    }, [])

    async function set(data: T) {
        try {
            await fetchAndThrow(url, {
                method: 'POST',
                body: JSON.stringify(data),
            })

            enqueueSnackbar('Data saved', { variant: 'success' })
            setValue(data)
        }
        catch (e) {
            console.error(e)
            enqueueSnackbar('Error saving data', { variant: 'error' })
        }
    }

    return [value, setValue]
}