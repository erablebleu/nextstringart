'use client'

import { Action } from "@/app/action";
import { Entity, Instructions } from "@/model";
import { fetchAndThrow } from "@/tools/fetch";
import { Delete } from "@mui/icons-material";
import { Button, ButtonGroup, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import React from "react";
import useSWR from "swr";

type Parameters = {
    projectId: string
    selectedId?: string
    onSelected?: (item: Instructions & Entity) => void
}

export const getFetcher = async (url: URL) => (await Action.try(async () => await fetchAndThrow(url, { method: 'GET' })))?.json()

export default function ({ projectId, selectedId, onSelected }: Parameters) {
    const { data, isLoading, mutate } = useSWR(`/api/project/${projectId}/instructions`, getFetcher, { refreshInterval: 2000 })

    async function handleSelect(item: Instructions & Entity) {
        onSelected?.(item)
    }

    async function handleDelete(item: Instructions & Entity) {
        try {
            await fetch(`/api/project/${projectId}/instructions/${item.id}`, { method: 'DELETE' })
            mutate()
        }
        catch (e) {
            enqueueSnackbar('Error deleting instructions', { variant: 'error' })
        }
    }

    if (isLoading || !data)
        return <React.Fragment>Loading ...</React.Fragment>

    return (
        <List sx={{ flexGrow: 1, overflow: 'auto' }}
        >
            {!isLoading && data.sort((a: Instructions & Entity, b: Instructions & Entity) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((item: Instructions & Entity) => (
                <ListItem key={item.id} disablePadding>
                    <ListItemButton selected={selectedId == item.id}
                        onClick={() => handleSelect(item)}>
                        <ListItemText
                            primary={item.createdAt?.toString() ?? item.id}
                            secondary={item.id} />
                    </ListItemButton>
                    <ButtonGroup
                        size="small">
                        <Button
                            onClick={() => handleDelete(item)}
                            color="error">
                            <Delete />
                        </Button>

                    </ButtonGroup>
                </ListItem>
            ))}
        </List>
    )
}