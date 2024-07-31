
import React, { ReactElement, ReactNode } from "react";
import {
    Experimental_CssVarsProvider as CssVarsProvider,
    experimental_extendTheme as extendTheme,
} from '@mui/material/styles';
import { CssBaseline } from "@mui/material";
import '../styles/global.css'
import { NextPage } from "next";
import Layout from "@/components/layout";
import { AppProps } from "next/app";

const theme = extendTheme()

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: ReactElement) => ReactNode
}

export default function ({ Component, pageProps }: AppProps) {
    return (
        <React.Fragment>            
        {/* <CssVarsProvider theme={theme} defaultMode='light' > */}
            <CssBaseline />
            <Layout>
                <Component {...pageProps} />
            </Layout>
        {/* </CssVarsProvider> */}
        </React.Fragment>
    )
}