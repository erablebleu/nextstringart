'use client'

import { ReactElement, ReactNode, useState } from 'react'
import { SnackbarProvider } from 'notistack'
import { CssBaseline, ThemeProvider } from '@mui/material'
import theme from './theme'
import { AppContext } from '@/contexts/appContext'

export function Providers({ children }: { children: ReactNode }) {
    const [appBar, setAppBar] = useState<ReactElement | undefined>()

    return (
        <ThemeProvider theme={theme} >
            <SnackbarProvider maxSnack={4} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <AppContext.Provider value={{ appBar, setAppBar }}>
                    <CssBaseline />
                    {children}
                </AppContext.Provider>
            </SnackbarProvider>
        </ThemeProvider>
    )
}