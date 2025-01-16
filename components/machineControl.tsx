'use client'

import { Action } from "@/app/action"
import { useInterval } from "@/hooks"
import { fetchAndThrow } from "@/tools/fetch"
import { MachineInfo, MachineJobStatus, MachineStatus } from "@/tools/machine/machineInfo"
import { CropSquare, Home, Pause, PlayArrow } from "@mui/icons-material"
import { Button, ButtonGroup, Grid, Typography } from "@mui/material"
import { enqueueSnackbar } from "notistack"
import React from "react"

const Steps = {
    tx: [-100, -10, -1, 'home', 1, 10, 100],
    tz: [-10, -5, -1, 'home', 1, 5, 10],
    rz: [-10, -5, -1, 'home', 1, 5, 10],
}

export type MachineControlParameters = {
    machineInfo: MachineInfo
}

export default function (parameters: MachineControlParameters) {
    const [state, setState] = React.useState<MachineInfo>(parameters.machineInfo)

    useInterval(async () => {
        try {
            const response = await fetchAndThrow('/api/machine/info', { method: 'Get' })
            const data = await response.json()
            setState(data)
        }
        catch { }
    }, 1000)

    async function handleMove(axis: string, value: number | 'home', name: string) {
        const body = JSON.stringify({
            name,
            [axis]: value
        })

        try {
            await fetchAndThrow('/api/machine/move', { method: 'POST', body: body })
            enqueueSnackbar(`Move order successfully sent instruction: ${body}`, { variant: 'success' })
        }
        catch (e) {
            console.error(e)
            enqueueSnackbar(`Error sending move order: ${body}`, { variant: 'error' })
        }
    }

    return (
        <Grid container spacing={2}>

            <Grid item xs={12}>
                <ButtonGroup>
                    <Button
                        disabled={state.status != MachineStatus.Disconnected}
                        onClick={() => Action.try(async () => await fetchAndThrow('/api/machine/connect', { method: 'POST' }))}>Connect</Button>
                    <Button
                        disabled={state.status == MachineStatus.Disconnected}
                        onClick={() => Action.try(async () => await fetchAndThrow('/api/machine/disconnect', { method: 'POST' }))} >Disconnect</Button>
                </ButtonGroup>
            </Grid>

            <Grid item xs={12} container direction='row' >
                <ButtonGroup disabled={!state.job}>
                    <Button
                        disabled={state.job?.status == MachineJobStatus.Running}
                        onClick={() => Action.try(async () => await fetchAndThrow('/api/machine/job/sartorresume', { method: 'POST' }))}>
                        <PlayArrow />
                    </Button>
                    <Button
                        disabled={state.job?.status == MachineJobStatus.Finished || state.job?.status == MachineJobStatus.Paused}
                        onClick={() => Action.try(async () => await fetchAndThrow('/api/machine/job/pause', { method: 'POST' }))}>
                        <Pause />
                    </Button>
                    <Button
                        disabled={state.job?.status != MachineJobStatus.Running}
                        onClick={() => Action.try(async () => await fetchAndThrow('/api/machine/job/cancel', { method: 'POST' }))}>
                        <CropSquare />
                    </Button>
                </ButtonGroup>
                {state.job && <Typography margin={1}>
                    {state.job.name}: {MachineJobStatus[state.job.status]} {state.job.commandIndex} / {state.job.commandCount}
                </Typography>}
            </Grid>

            <Grid item xs={12}>
                {['tx', 'tz', 'rz'].map(axis => (
                    <Grid key={axis} item container direction='row'>
                        <ButtonGroup 
                            variant="outlined"
                            disabled={state.status != MachineStatus.Connected}
                        >
                            {Steps[axis].map((x: number | 'home') => (
                                <Button key={`k_${x}`} onClick={() => handleMove(axis, x, `${axis}_${x}`)}>{x === 'home' ? <Home /> : x > 0 ? `+${x}` : x}</Button>
                            ))}
                        </ButtonGroup>
                        <Typography margin={1}>{axis} = {state[axis].toFixed(2)}</Typography>
                    </Grid>
                ))}
            </Grid>
        </Grid>
    )
}