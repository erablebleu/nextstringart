'use client'

import { Action } from "@/app/action";
import { ProjectVersionInfo } from "@/model";
import { fetchAndThrow } from "@/tools/fetch";
import { List, ListItem, ListItemButton, ListItemText, Rating, Stack } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import useSWR from "swr";

export const getFetcher = async (url: URL) => (await Action.try(async () => await fetchAndThrow(url, { method: 'GET' })))?.json()

type Options = {
    projectId: string
}

export default function ({ projectId }: Options) {
    const { data, mutate, isLoading } = useSWR(`/api/project/${projectId}/all`, getFetcher, { refreshInterval: 1000, dedupingInterval: 1000, })
    const router = useRouter()
    const pathname = usePathname()
    const selectedProjectVersion = pathname.split('/')[3]

    async function handleSelect(item: ProjectVersionInfo) {
        const pathSegments = pathname.split('/')
        pathSegments.splice(0, 4)
        router.push(`/project/${projectId}/${item.version}/${pathSegments.join('/')}`)
    }

    if (isLoading || !data)
        return <React.Fragment>Loading ...</React.Fragment>

    return (
        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
            {!isLoading && data
                .sort((a: ProjectVersionInfo, b: ProjectVersionInfo) => -a.version.localeCompare(b.version))
                .map((item: ProjectVersionInfo) => (
                    <ListItem key={item.version} disablePadding>
                        <ListItemButton
                            selected={item.version == selectedProjectVersion}
                            onClick={() => handleSelect(item)}>
                            <Stack>
                                <ListItemText primary={item.version} />
                                <Rating
                                    size="small"
                                    value={item.rating}
                                    precision={0.5}
                                    readOnly>
                                </Rating>
                            </Stack>
                        </ListItemButton>
                    </ListItem>
                ))}
        </List>
    )
}