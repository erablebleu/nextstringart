'use client'

import React from 'react'
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles'
import { SnackbarProvider } from 'notistack'
import { CssBaseline } from '@mui/material'
import theme from './theme';
import { AppContext } from '@/contexts/appContext'

export function Providers({ children }: { children: React.ReactNode }) {
    const [appBar, setAppBar] = React.useState<React.ReactElement | undefined>()

    return (
        <CssVarsProvider theme={theme} defaultMode='system' >
            <SnackbarProvider maxSnack={4} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <AppContext.Provider value={{ appBar, setAppBar }}>
                    <CssBaseline />
                    {children}
                </AppContext.Provider>
            </SnackbarProvider>
        </CssVarsProvider>
    )
}