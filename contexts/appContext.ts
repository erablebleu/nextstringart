'use client'

import { createContext, DependencyList, Dispatch, ReactElement, SetStateAction, useContext, useEffect } from 'react'

export type AppContextType = {
    appBar?: ReactElement
    setAppBar: Dispatch<SetStateAction<ReactElement | undefined>>
}

export const AppContext = createContext<AppContextType | undefined>(undefined)

export namespace App {

    function useApp() {
        const appContext = useContext(AppContext)

        if (!appContext) {
            throw new Error('No AppContext provider found when calling useApp!');
        }

        return {
            ...appContext,
        }
    }

    export function useAppBar(appBar: ReactElement, deps?: DependencyList) {
        const { setAppBar } = useApp()

        useEffect(() => {
            setAppBar(appBar)

            return () => { setAppBar(undefined) }
        }, deps)
    }
}