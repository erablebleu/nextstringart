'use client'

import { Action } from "@/app/action"
import { ProjectVersionInfo } from "@/model"
import { CalculationJobInfo } from "@/tools/calculation/calculationJob"
import { fetchAndThrow } from "@/tools/fetch"
import { LinearProgress, List, ListItem, ListItemButton, ListItemText, Rating, Stack } from "@mui/material"
import { usePathname, useRouter } from "next/navigation"
import { Fragment } from "react"
import useSWR from "swr"

export const getFetcher = async (url: URL) => (await Action.try(async () => await fetchAndThrow(url, { method: 'GET' })))?.json()

type Options = {
    projectId: string
}

export default function ({ projectId }: Options) {
    const { data, mutate, isLoading } = useSWR(`/api/project/${projectId}/all`, getFetcher, { refreshInterval: 1000, dedupingInterval: 1000, })
    const router = useRouter()
    const pathname = usePathname()
    const selectedProjectVersion = pathname.split('/')[3]

    function isRunning(item: ProjectVersionInfo & CalculationJobInfo): boolean {
        return item.progress !== undefined
    }

    async function handleSelect(item: ProjectVersionInfo & CalculationJobInfo) {
        const pathSegments = pathname.split('/')
        pathSegments.splice(0, 4)

        const target = isRunning(item)
            ? `/project/${projectId}/${item.version}/result`
            : `/project/${projectId}/${item.version}/${pathSegments.join('/')}`

        router.push(target)
    }

    if (isLoading || !data)
        return <Fragment>
            Loading ...
        </Fragment>

    return (
        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
            {!isLoading && data
                .sort((a: ProjectVersionInfo, b: ProjectVersionInfo) => -a.version.localeCompare(b.version))
                .map((item: ProjectVersionInfo & CalculationJobInfo) => (
                    <ListItem key={item.version} disablePadding>
                        <ListItemButton
                            selected={item.version == selectedProjectVersion}
                            onClick={() => handleSelect(item)}>
                            <Stack>
                                <ListItemText primary={item.version} />
                                {isRunning(item)
                                    ? <LinearProgress variant="determinate" value={item.progress * 100}
                                        sx={{ width: '100%' }} />
                                    : <Rating
                                        size="small"
                                        value={item.rating ?? 0}
                                        precision={0.5}
                                        readOnly>
                                    </Rating>
                                }
                            </Stack>
                        </ListItemButton>
                    </ListItem>
                ))}
        </List>
    )
}