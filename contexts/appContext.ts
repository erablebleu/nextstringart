import { useSnackbar } from 'notistack'
import React, { DependencyList } from 'react'

export type AppContextType = {
    appBar?: React.ReactElement
    setAppBar: React.Dispatch<React.SetStateAction<React.ReactElement | undefined>>
}

export const AppContext = React.createContext<AppContextType | undefined>(undefined)

export namespace App {

    function useApp() {
        const appContext = React.useContext(AppContext)

        if (!appContext) {
            throw new Error('No AppContext provider found when calling useApp!');
        }


        return {
            ...appContext,
        }
    }

    export function useAppBar(appBar: React.ReactElement, deps?: DependencyList) {
        const { setAppBar } = useApp()

        React.useEffect(() => {
            setAppBar(appBar)

            return () => { setAppBar(undefined) }
        }, deps)
    }
}