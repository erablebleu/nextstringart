'use client'

import { Action } from "@/app/action"
import { Entity, Frame } from "@/model"
import { fetchAndThrow } from "@/tools/fetch"
import { List, ListItem, ListItemButton, ListItemText } from "@mui/material"
import Link from "next/link"
import { Fragment } from "react"
import useSWR from "swr"

export const getFetcher = async (url: URL) => (await Action.try(async () => await fetchAndThrow(url, { method: 'GET' })))?.json()

export default function () {
    const { data, isLoading } = useSWR(`/api/frame`, getFetcher, {})

    if (isLoading || !data)
        return <Fragment>
            Loading ...
        </Fragment>

    return (
        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
            {!isLoading && data.sort((a, b) => a.name.localeCompare(b.name)).map((item: Frame & Entity) => (
                <ListItem key={item.id} disablePadding>
                    <ListItemButton                        
                        href={`/frame/${item.id}`}
                        LinkComponent={Link}>
                        <ListItemText primary={item.name ?? item.id} secondary={item.description} />
                    </ListItemButton>
                </ListItem>
            ))}
        </List>
    )
}