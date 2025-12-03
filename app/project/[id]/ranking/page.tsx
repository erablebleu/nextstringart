'use client'

import { IdParameters } from "@/app/parameters"
import NumericInput from "@/components/numericInput"
import ThreadPreviewer from "@/components/threadPreviewer"
import { useLocalStorage } from "@/hooks"
import { Instructions, ProjectVersionInfo } from "@/model"
import { CalculationJobInfo } from "@/tools/calculation/calculationJob"
import { fetchAndThrow } from "@/tools/fetch"
import { LocalStorage } from "@/tools/localStorage"
import { Box, Grid, Link, List, ListItem, ListItemButton, ListItemText, Rating, Stack, Typography } from "@mui/material"
import { useRouter } from "next/navigation"
import { Fragment, use, useEffect, useState } from "react"

type Settings = {
    thickness: number
    ranking: Array<string>
}

type State = {
    versions: { [key: string]: ProjectVersionInfo }
    toRank: Array<string>
    ranking: Array<string>
}

type Range = {
    index: number
    size: number
}

type VersionState = {
    id: string
    range: Range
}

function splitRange(range: Range) {

}

export default function ({ params }: { params: Promise<IdParameters> }) {
    const router = useRouter()
    const { id: projectId } = use(params)
    const localStorageKey = `ranking_${projectId}`

    const [settings, setSettings] = useLocalStorage<Settings>(localStorageKey, {
        thickness: 0.20,
        ranking: [],
    })
    const [state, setState] = useState<State>()
    const [versionData, setVersionData] = useState<{ [key: string]: Instructions }>({})
    const [versionState, setVersionState] = useState<VersionState>()

    useEffect(() => {
        load()

        async function load() {
            try {
                const response = await fetchAndThrow(`/api/project/${projectId}/all`, { method: 'GET' })
                const versionsInfos: Array<ProjectVersionInfo & CalculationJobInfo> = (await response.json()).filter((v: ProjectVersionInfo & CalculationJobInfo) => v.progress === undefined)
                const versions = versionsInfos.map((v: ProjectVersionInfo & CalculationJobInfo) => v.version)
                let ranking = (LocalStorage.get<Settings>(localStorageKey)?.ranking ?? []).filter(id => versions.includes(id))

                if (versions.length == 0) { } // no data
                else if (versions.length == 1) // single data
                    ranking = versions
                else if (ranking.length == 0)
                    ranking = [versions[0]]

                setState({
                    versions: versionsInfos.reduce((acc, b) => ({ ...acc, [b.version]: b }), {}),
                    ranking,
                    toRank: versions.filter((id: string) => !ranking.includes(id)),
                })
            }
            catch (e) {
            }
        }
    }, [projectId])

    if (!state)
        return <Fragment>
            Loading ...
        </Fragment>

    if (state.toRank.length == 0) {
        return <List sx={{ flexGrow: 1, overflow: 'auto' }}>
            {state.ranking
                .map((id: string) => (
                    <ListItem key={id} disablePadding>
                        <ListItemButton
                            href={`/project/${projectId}/${id}/result`}
                            LinkComponent={Link}>
                            <Stack>
                                <ListItemText primary={id} />
                            </Stack>
                        </ListItemButton>
                    </ListItem>
                ))}
        </List>
    }

    if (!versionState) {
        setVersionState({
            id: state.toRank[0],
            range: {
                index: 0,
                size: state.ranking.length,
            }
        })

        return <Fragment>
            Loading ...
        </Fragment>
    }

    const compIndex = versionState.range.index + Math.floor(versionState.range.size / 2)
    const compId = state.ranking[compIndex]

    console.log({
        state,
        versionState,
        compIndex,
        compId
    })

    function select(projectVersion: string) {
        console.log('select ' + projectVersion)
        const range = projectVersion == versionState!.id
            ? {
                index: versionState!.range.index,
                size: compIndex - versionState!.range.index,
            }
            : {
                index: compIndex + 1,
                size: versionState!.range.size - (compIndex + 1 - versionState!.range.index),
            }


        if (range.size == 0) {
            const ranking: Array<string> = state!.ranking
            const toRank: Array<string> = state!.toRank.filter((id: string) => id != versionState!.id)

            console.log(`add ${versionState!.id} to rank ${range.index}`)
            ranking.splice(range.index, 0, versionState!.id)

            setSettings({
                ...settings,
                ranking,
            })
            setState({
                ...state!,
                ranking,
                toRank,
            })
            setVersionState(undefined)
        }
        else {
            console.log(`new range ${range.index}, ${range.size}`)
            setVersionState({
                ...versionState!,
                range
            })
        }
    }

    async function loadData(projectVersion: string) {
        if (versionData[projectVersion])
            return

        const result = await fetchAndThrow(`/api/project/${projectId}/${projectVersion}/instructions`, { method: 'GET' })
        const data = await result.json()

        setVersionData({
            ...versionData,
            [projectVersion]: data,
        })
    }

    function getPreviewer(projectVersion: string) {
        if (versionData[projectVersion])
            return <Grid
                item
                flexGrow={1}
                display='flex'
                justifyContent='center'
                sx={{ background: 'white', position: 'relative' }}>
                <ThreadPreviewer
                    instructions={versionData[projectVersion]}
                    showNails={true}
                    strokeWidth={settings.thickness} />
                <Typography 
                    color="black" 
                    textAlign='center'
                    style={{ height: '100%', width: '100%', top: 0, left: 0, position: 'absolute', cursor: 'pointer', zIndex: 98 }}>{projectVersion}</Typography>
                <div
                    title={projectVersion}
                    style={{ height: '100%', width: '100%', top: 0, left: 0, position: 'absolute', cursor: 'pointer', zIndex: 99 }}
                    onClick={() => select(projectVersion)}></div>
            </Grid>

        return <Fragment>
            Loading ...
        </Fragment>
    }

    loadData(versionState.id)
    loadData(compId)

    return (

        <Box
            height='100%'
            display='flex'
            flexDirection='row'>
            <List sx={{ overflow: 'auto' }}>
                    {state.ranking.map((projectVersion: string, index: number) => <ListItem disablePadding>
                        <ListItemButton
                            href={`/project/${projectId}/${projectVersion}/result`}
                            selected={compIndex == index}
                            LinkComponent={Link}>
                            <Stack>
                                <ListItemText primary={`${index + 1}: ${projectVersion}`} />
                                <Rating
                                    size="small"
                                    value={state.versions[projectVersion]?.rating ?? 0}
                                    precision={0.5}
                                    readOnly>
                                </Rating>
                            </Stack>
                        </ListItemButton>
                    </ListItem>)}

                </List>
            <Box
                height='100%'
                flexGrow={1}
                display='flex'
                flexDirection='column'>
                <Stack
                    direction='row'
                    spacing={1}
                    marginTop={1}>
                    <Typography>{state.ranking.length} / {state.ranking.length + state.toRank.length}</Typography>
                    <NumericInput
                        label="thickness"
                        value={settings.thickness}
                        onChange={v => setSettings({
                            ...settings,
                            thickness: v,
                        })}
                        hideButtons
                        sx={{ width: '80px' }}
                    />
                </Stack>
                <Grid
                    container
                    height='100%'
                    display='flex'
                    flexGrow={1}
                    flexDirection='row'
                >
                    {getPreviewer(versionState.id)}
                    {getPreviewer(compId)}
                </Grid>
            </Box>
        </Box >
    )
}