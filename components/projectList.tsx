'use client'

import { Action } from "@/app/action"
import { Entity, Project } from "@/model"
import { fetchAndThrow } from "@/tools/fetch"
import { List, ListItem, ListItemButton, ListItemText } from "@mui/material"
import Link from "next/link"
import { Fragment } from "react"
import useSWR from "swr"

export const getFetcher = async (url: URL) => (await Action.try(async () => await fetchAndThrow(url, { method: 'GET' })))?.json()

export default function () {
    const { data, mutate, isLoading } = useSWR(`/api/project`, getFetcher, {})

    if (isLoading || !data)
        return <Fragment>
            Loading ...
        </Fragment>

    return (
        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
            {!isLoading && data.sort((a, b) => a.name.localeCompare(b.name)).map((item: Project & Entity) => (
                <ListItem 
                    key={item.id} 
                    disablePadding>
                    <ListItemButton
                        href={`/project/${item.id}`}
                        LinkComponent={Link}>
                        <ListItemText primary={item.name ?? item.id} secondary={item.description} />
                    </ListItemButton>
                </ListItem>
            ))}
        </List>
    )
}