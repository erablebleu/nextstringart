'use client'

import { Action } from "@/app/action";
import { CalculationJobInfo } from "@/tools/calculation/calculationJob";
import { fetchAndThrow } from "@/tools/fetch";
import { Cancel } from "@mui/icons-material";
import { Button, ButtonGroup, LinearProgress, List, ListItem, ListItemButton, ListItemText, Stack } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { Fragment } from "react";
import useSWR from "swr";

type Parameters = {
    projectId: string
    selectedId?: string
    onSelected?: (item: CalculationJobInfo) => void
}

export const getFetcher = async (url: URL) => (await Action.try(async () => await fetchAndThrow(url, { method: 'GET' })))?.json()

export default function ({ projectId, selectedId, onSelected }: Parameters) {
    const { data, isLoading } = useSWR(`/api/project/${projectId}/calculation`, getFetcher, { refreshInterval: 500, dedupingInterval: 500, })

    async function handleSelect(item: CalculationJobInfo) {
        onSelected?.(item)
    }

    async function handleCancel(item: CalculationJobInfo) {
        try {
            await fetch(`/api/calculation/${item.id}/cancel`, { method: 'POST' })
        }
        catch (e) {
            enqueueSnackbar('Error canceling calculation job', { variant: 'error' })
        }
    }

    if (isLoading || !data)
        return <Fragment>
            Loading ...
        </Fragment>

    return (
        <List
            sx={{
                height: '100%',
                flexGrow: 1,
                overflow: 'auto'
            }}>
            {!isLoading && data.sort((a: CalculationJobInfo, b: CalculationJobInfo) => new Date(b.startedAt!).getTime() - new Date(a.startedAt!).getTime()).map((item: CalculationJobInfo) => (
                <ListItem key={item.id} disablePadding>
                    <ListItemButton selected={selectedId == item.id}
                        onClick={() => handleSelect(item)}>
                        <Stack>
                            <ListItemText primary={item.startedAt?.toString() ?? item.id} />
                            <LinearProgress variant="determinate" value={item.progress * 100}
                                sx={{ width: '100%' }} />
                        </Stack>
                    </ListItemButton>
                    <ButtonGroup size="small">
                        <Button
                            onClick={() => handleCancel(item)}
                            color="error">
                            <Cancel />
                        </Button>
                    </ButtonGroup>
                </ListItem>
            ))}
        </List>
    )
}