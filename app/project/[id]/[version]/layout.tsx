'use client'

import { Fragment, ReactNode, use } from "react"
import { usePathname, useRouter } from "next/navigation";
import { IdParameters } from "@/app/parameters";
import { Box, Button, ButtonGroup, Stack, Tab, Tabs, Typography } from "@mui/material";
import { Delete } from "@mui/icons-material";
import { Action } from "@/app/action";
import { fetchAndThrow } from "@/tools/fetch";
import { enqueueSnackbar } from "notistack";
import { App } from "@/contexts/appContext";
import { useData } from "@/hooks";
import { Project } from "@/model";
import Link from "next/link";

export type Parameters = IdParameters & {
    version: string
}

export default function ({ children, params }: { children: ReactNode, params: Promise<Parameters> }) {
    const { id: projectId, version: projectVersion } = use(params)
    const [project] = useData<Project>(`/api/project/${projectId}`, { method: 'GET' })
    const router = useRouter()
    const pathname = usePathname()
    let tab = pathname.split('/').at(-1)

    if (!tab || !['raw', 'settings', 'map', 'result'].includes(tab))
        tab = 'raw'

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
        <Fragment>
            <Stack>
                <Tabs value={tab}>
                    <Tab value="raw" label="Raw" href={`/project/${projectId}/${projectVersion}/raw`} LinkComponent={Link} />
                    <Tab value="settings" label="Settings" href={`/project/${projectId}/${projectVersion}/settings`} LinkComponent={Link} />
                    <Tab value="map" label="Map" href={`/project/${projectId}/${projectVersion}/map`} LinkComponent={Link} />
                    <Tab value="result" label="Result" href={`/project/${projectId}/${projectVersion}/result`} LinkComponent={Link} />
                </Tabs>
            </Stack>
            <Stack
                direction='row'
                spacing={1}
                flexGrow={1}
                alignContent='center'
                justifyContent='center'
            >
                <Typography
                    color="grey"
                    textTransform='uppercase'
                >
                    project: {project?.name}
                </Typography>
            </Stack>
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
        </Fragment>, [project, projectId, projectVersion, tab])

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
