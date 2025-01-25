'use client'

import { Action } from '@/app/action'
import { fetchAndThrow } from '@/tools/fetch'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'

export function useData<T>(url: string | URL | globalThis.Request, init?: RequestInit): [T | undefined, Dispatch<SetStateAction<T | undefined>>] {
    const [value, setValue] = useState<T>()

    useEffect(() => {
        Action.try(async () => {
            const result = await fetchAndThrow(url, { method: 'GET' })
            const data = await result.json()
            setValue(data)
        })
    }, [])

    return [value, setValue]
}