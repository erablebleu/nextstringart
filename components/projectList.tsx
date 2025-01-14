'use client'

import { Action } from "@/app/action";
import { Entity, Project } from "@/model";
import { fetchAndThrow } from "@/tools/fetch";
import { List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { useRouter } from "next/navigation";
import React from "react";
import useSWR from "swr";

export const getFetcher = async (url: URL) => (await Action.try(async () => await fetchAndThrow(url, { method: 'GET' })))?.json()

export default function () {
    const { data, mutate, isLoading } = useSWR(`/api/project`, getFetcher, {})
    const router = useRouter()

    async function handleSelect(item: Project & Entity) {
        router.push(`/project/${item.id}`)
    }

    if (isLoading)
        return <React.Fragment>Loading ...</React.Fragment>

    return (
        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
            {!isLoading && data.map((item: Project & Entity) => (
                <ListItem key={item.id} disablePadding>
                    <ListItemButton
                        onClick={() => handleSelect(item)}>
                        <ListItemText primary={item.name ?? item.id} />
                    </ListItemButton>
                </ListItem>
            ))}
        </List>
    )
}