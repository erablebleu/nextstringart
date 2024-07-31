import { IProject } from '@/model/project'
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'

export default function useProject(uuid: string): [IProject | undefined, Dispatch<SetStateAction<IProject | undefined>>] {
    const key: string = `project_${uuid}`
    const mounted = useRef(false)
    const [value, setValue] = useState<IProject | undefined>()

    useEffect(() => {
        try {
            const item = window.localStorage.getItem(key)
            if (item) {
                console.log("get item")
                setValue(JSON.parse(item))
            }
        } catch (e) {
            console.error(e)
        }
        return () => {
            mounted.current = false
        }
    }, [key, uuid])

    useEffect(() => {
        if (mounted.current) {
            window.localStorage.setItem(key, JSON.stringify(value))
        } else {
            mounted.current = true
        }
    }, [key, uuid, value])

    return [value, setValue]
}