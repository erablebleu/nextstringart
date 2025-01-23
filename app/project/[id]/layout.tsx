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

export default function ({ children, params }: { children: React.ReactNode, params: IdParameters }) {
    const id = params.id
    const router = useRouter()
    const pathname = usePathname()
    let tab = pathname.split('/').at(-1)

    if (!tab || !['raw', 'settings', 'map', 'calculation'].includes(tab))
        tab = 'raw'

    async function handleTabChange(event: React.SyntheticEvent, tab: string) {
        router.push(`/project/${params.id}/${tab}`)
    }

    async function handleDelete() {
        try {
            if (!await Action.askConfirmation(`Do you want to delete the project ?`))
                return

            await fetchAndThrow(`/api/project/${id}`, { method: 'DELETE' })
            router.push('/')
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
                    <Tab value="calculation" label="Claculation" />
                </Tabs>
            </Box>
            <Box>
                <ButtonGroup>
                    <Button
                        color='error'
                        onClick={(handleDelete)}
                        endIcon={<Delete />}>
                        Delete Project
                    </Button>
                </ButtonGroup>
            </Box>
        </React.Fragment>, [id, tab])

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
