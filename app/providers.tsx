'use client'
import React from 'react'
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles'
import { SnackbarProvider } from 'notistack'
import { CssBaseline } from '@mui/material'
import theme from './theme';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <CssVarsProvider theme={theme} defaultMode='system' >
            <SnackbarProvider maxSnack={4} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <CssBaseline />
                {children}
            </SnackbarProvider>
        </CssVarsProvider>
    )
}