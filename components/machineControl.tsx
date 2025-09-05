'use client'

import { Action } from "@/app/action"
import { useLocalStorage } from "@/hooks"
import { fetchAndThrow } from "@/tools/fetch"
import { MachineJobStatus, MachineStatus } from "@/tools/machine/machineInfo"
import { Add, CropSquare, Home, Pause, PlayArrow, Remove } from "@mui/icons-material"
import { Button, ButtonGroup, MenuItem, Select, Stack, Typography } from "@mui/material"
import { enqueueSnackbar } from "notistack"
import { Fragment } from "react"
import useSWR from "swr"

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

const fetcher = (url: URL) => fetch(url, { method: 'GET' }).then(r => r.json())

export default function () {
    const { data, isLoading } = useSWR(`/api/machine/info`, fetcher, { refreshInterval: 1000, dedupingInterval: 1000, })
    const [step, setStep] = useLocalStorage('machine.control.step', {
        tx: 1,
        tz: 1,
        rz: 1,
    })

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
        handleMove(axis, -(Axis[axis].convert?.(value) ?? value))
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

    if (isLoading) {
        return <Fragment>
            Loading
        </Fragment>
    }

    return (
        <Stack spacing={5}>

            <ButtonGroup>
                <Button
                    disabled={data.status != MachineStatus.Disconnected}
                    onClick={() => Action.try(async () => await fetchAndThrow('/api/machine/connect', { method: 'POST' }))}>Connect</Button>
                <Button
                    disabled={data.status == MachineStatus.Disconnected}
                    onClick={() => Action.try(async () => await fetchAndThrow('/api/machine/disconnect', { method: 'POST' }))} >Disconnect</Button>
            </ButtonGroup>

            <Stack direction='row'>
                <ButtonGroup disabled={!data.job}>
                    <Button
                        disabled={data.job?.status == MachineJobStatus.Running}
                        onClick={() => Action.try(async () => await fetchAndThrow('/api/machine/job/startorresume', { method: 'POST' }))}>
                        <PlayArrow />
                    </Button>
                    <Button
                        disabled={data.job?.status == MachineJobStatus.Finished || data.job?.status == MachineJobStatus.Paused}
                        onClick={() => Action.try(async () => await fetchAndThrow('/api/machine/job/pause', { method: 'POST' }))}>
                        <Pause />
                    </Button>
                    <Button
                        onClick={() => Action.try(async () => await fetchAndThrow('/api/machine/job/cancel', { method: 'POST' }))}>
                        <CropSquare />
                    </Button>
                    <Button
                        disabled={data.job?.status != undefined}
                        onClick={() => Action.try(async () => await fetchAndThrow('/api/machine/job/resend', { method: 'POST' }))}>
                        Resend
                    </Button>
                </ButtonGroup>
                {data.job && <Typography margin={1}>
                    {data.job.name}: {MachineJobStatus[data.job.status]} {data.job.commandIndex} / {data.job.commandCount}
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
                            {axis}: {(Axis[axis].format?.(data[axis]) ?? data[axis]).toFixed(2)}
                        </Typography>
                    </Stack>
                ))}
            </Stack>
        </Stack>
    )
}