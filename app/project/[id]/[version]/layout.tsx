'use client'

import React from "react"
import { usePathname, useRouter } from "next/navigation";
import { IdParameters } from "@/app/parameters";
import { Box, Button, ButtonGroup, Tab, Tabs } from "@mui/material";
import { Delete } from "@mui/icons-material";
import { Action } from "@/app/action";
import { fetchAndThrow } from "@/tools/fetch";
import { enqueueSnackbar } from "notistack";
import { App } from "@/contexts/appContext";

export type Parameters = IdParameters & {
    version: string
}

export default function ({ children, params }: { children: React.ReactNode, params: Parameters }) {
    const projectId = params.id
    const projectVersion = params.version
    const router = useRouter()
    const pathname = usePathname()
    let tab = pathname.split('/').at(-1)

    if (!tab || !['raw', 'settings', 'map', 'result'].includes(tab))
        tab = 'raw'

    async function handleTabChange(event: React.SyntheticEvent, tab: string) {
        router.push(`/project/${projectId}/${projectVersion}/${tab}`)
    }

    async function handleDelete() {
        try {
            if (!await Action.askConfirmation(`Do you want to delete the version ?`))
                return

            await fetchAndThrow(`/api/project/${projectId}/${projectVersion}`, { method: 'DELETE' })
            router.push(`/project/${projectId}`)
        }
        catch (e) {
            enqueueSnackbar('Deletion error', { variant: 'error' })
        }
    }

    App.useAppBar(
        <React.Fragment>
            <Box
                flexGrow={1}>
                <Tabs value={tab} onChange={handleTabChange}>
                    <Tab value="raw" label="Raw" />
                    <Tab value="settings" label="Settings" />
                    <Tab value="map" label="Map" />
                    <Tab value="result" label="Result" />
                </Tabs>
            </Box>
            <Box>
                <ButtonGroup>
                    <Button
                        color='error'
                        onClick={(handleDelete)}
                        endIcon={<Delete />}>
                        Delete
                    </Button>
                </ButtonGroup>
            </Box>
        </React.Fragment>, [projectId, projectVersion, tab])

    return (
        <Box
            height='100%'
            display='flex'
            flexDirection='column'>
            <Box
                height='100%'
                flexGrow={1}
                display='flex'
                flexDirection='column'>
                {children}
            </Box>
        </Box>
    )
}
