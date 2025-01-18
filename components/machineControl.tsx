'use client'

import { Action } from "@/app/action"
import { useInterval, useLocalStorage } from "@/hooks"
import { fetchAndThrow } from "@/tools/fetch"
import { MachineInfo, MachineJobStatus, MachineStatus } from "@/tools/machine/machineInfo"
import { Add, CropSquare, Home, Pause, PlayArrow, Remove } from "@mui/icons-material"
import { Box, Button, ButtonGroup, Grid, MenuItem, Select, Stack, Typography } from "@mui/material"
import { enqueueSnackbar } from "notistack"
import React from "react"

const Axis = {
    tx: {
        steps: [1, 10, 100],
    },
    tz: {
        steps: [1, 5, 10],
    },
    rz: {
        steps: [0.1, 1, 5, 10, 45, 60],
        convert: (v: number) => v * Math.PI / 180,
        format: (v: number) => v * 180 / Math.PI,
    },
}

export default function () {
    const [state, setState] = React.useState<MachineInfo | undefined>()
    const [step, setStep] = useLocalStorage('machine.control.step', {
        tx: 1,
        tz: 1,
        rz: 1,
    })

    useInterval(async () => {
        try {
            const response = await fetchAndThrow('/api/machine/info', { method: 'Get' })
            const data = await response.json()
            setState(data)
        }
        catch { }
    }, 1000)

    async function handleMove(axis: string, value: number | 'home') {
        const body = JSON.stringify({
            name: `${axis}_${value}`,
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

    async function handleHome(axis: string) {
        handleMove(axis, 'home')
    }

    async function handleMinus(axis: string) {
        const value: number = step[axis]
        handleMove(axis, Axis[axis].convert?.(value) ?? value)
    }

    async function handlePlus(axis: string) {
        const value: number = step[axis]
        handleMove(axis, Axis[axis].convert?.(value) ?? value)
    }

    async function handleStepChange(axis: string, value: number) {
        setStep({
            ...step,
            [axis]: value
        })
    }

    if (!state) {
        return <React.Fragment>
            Loading
        </React.Fragment>
    }

    return (
        <Stack spacing={5}>

            <ButtonGroup>
                <Button
                    disabled={state.status != MachineStatus.Disconnected}
                    onClick={() => Action.try(async () => await fetchAndThrow('/api/machine/connect', { method: 'POST' }))}>Connect</Button>
                <Button
                    disabled={state.status == MachineStatus.Disconnected}
                    onClick={() => Action.try(async () => await fetchAndThrow('/api/machine/disconnect', { method: 'POST' }))} >Disconnect</Button>
            </ButtonGroup>

            <Stack direction='row'>
                <ButtonGroup disabled={!state.job}>
                    <Button
                        disabled={state.job?.status == MachineJobStatus.Running}
                        onClick={() => Action.try(async () => await fetchAndThrow('/api/machine/job/startorresume', { method: 'POST' }))}>
                        <PlayArrow />
                    </Button>
                    <Button
                        disabled={state.job?.status == MachineJobStatus.Finished || state.job?.status == MachineJobStatus.Paused}
                        onClick={() => Action.try(async () => await fetchAndThrow('/api/machine/job/pause', { method: 'POST' }))}>
                        <Pause />
                    </Button>
                    <Button
                        onClick={() => Action.try(async () => await fetchAndThrow('/api/machine/job/cancel', { method: 'POST' }))}>
                        <CropSquare />
                    </Button>
                </ButtonGroup>
                {state.job && <Typography margin={1}>
                    {state.job.name}: {MachineJobStatus[state.job.status]} {state.job.commandIndex} / {state.job.commandCount}
                </Typography>}
            </Stack>

            <Stack spacing={1}>
                {['tx', 'tz', 'rz'].map(axis => (
                    <Stack key={axis} direction='row' spacing={1}>
                        <ButtonGroup
                            size="small">
                            <Button
                                onClick={() => handleHome(axis)}>
                                <Home />
                            </Button>
                        </ButtonGroup>
                        <ButtonGroup
                            size="small">
                            <Button
                                onClick={() => handleMinus(axis)}>
                                <Remove />
                            </Button>
                            <Select
                                size="small"
                                value={step[axis]}
                                sx={{ width: '80px' }}
                                onChange={(e) => handleStepChange(axis, e.target.value as number)}
                            >
                                {Axis[axis].steps.map((x: number | 'home') => (
                                    <MenuItem key={`k_${x}`} value={x}>{x}</MenuItem>
                                ))}
                            </Select>
                            <Button
                                onClick={() => handlePlus(axis)}>
                                <Add />
                            </Button>
                        </ButtonGroup>

                        <Typography
                            alignContent='center'>
                            {axis}: {(Axis[axis].format?.(state[axis]) ?? state[axis]).toFixed(2)}
                        </Typography>
                    </Stack>
                ))}
            </Stack>
        </Stack>
    )
}