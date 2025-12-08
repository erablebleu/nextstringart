'use client'

import { FormControlLabel, Checkbox, Grid, Button, ButtonGroup, Stack, TextField, Typography, Rating, InputAdornment, Slider } from "@mui/material"
import { ChevronLeft, ChevronRight, FirstPage, LastPage } from "@mui/icons-material"
import { Instructions, Nail, ProjectVersionInfo, RotationDirection, Step } from "@/model"
import { fetchAndThrow } from "@/tools/fetch"
import { useLocalStorage } from "@/hooks"
import { Speech } from "@/tools/speech"
import { ChangeEvent, Fragment, useEffect, useState } from "react"
import NumericInput from "./numericInput"
import ThreadPreviewer from "./threadPreviewer"


type Options = {
    projectId: string
    projectVersion: string
}

export default function ({ projectId, projectVersion }: Options) {
    const [settings, setSettings] = useLocalStorage(`stepper_settings_${projectId}_${projectVersion}`, {
        fromStep: 0,
        toStep: 100,
        offset: 0,
        thickness: 0.20,
        speech: false,
    })

    const [state, setState] = useState<Instructions & {
        rating?: number
    } | undefined>()

    useEffect(() => {
        load()

        async function load() {
            try {
                const instructionPromise = fetchAndThrow(`/api/project/${projectId}/${projectVersion}/instructions`, { method: 'GET' })
                const versionInfoPromise = fetchAndThrow(`/api/project/${projectId}/${projectVersion}/versioninfo`, { method: 'GET' })

                const instructions: Instructions = await (await instructionPromise)?.json()
                const versionInfo: ProjectVersionInfo = await (await versionInfoPromise).json()

                settings.fromStep ??= 0
                settings.toStep ??= instructions.steps.length - 1

                setState({
                    ...instructions,
                    rating: versionInfo.rating,
                })
            }
            catch (e) {
            }
        }
    }, [projectId, projectVersion])

    async function goToStep(number: number) {
        setSettings({
            ...settings,
            toStep: number
        })
        const instruction: Step = state!.steps[number]

        if (settings.speech)
            Speech.say(`${(settings.offset + instruction.nailIndex) % state!.nails.length}. ${RotationDirection[instruction.direction]}`)
    }

    function handleChange(value: number, propertyName: string) {
        setSettings({
            ...settings,
            [propertyName]: value,
        })
    }

    function getStep(idx: number): Step {
        if (!state || idx < 0 || idx >= state.steps.length)
            return {
                nailIndex: 0,
                direction: RotationDirection.ClockWise,
            }

        return state.steps[idx]
    }

    function getNail(idx: number): Nail | undefined {
        if (!state || idx < 0 || idx >= state.nails.length)
            return

        return state.nails[idx]
    }

    async function handleRate(rating?: number) {
        try {
            setState({
                ...state!,
                rating,
            })
            await fetchAndThrow(`/api/project/${projectId}/${projectVersion}/rate`, {
                method: 'POST',
                body: JSON.stringify({
                    rating
                })
            })
        }
        catch (e) {
            console.error(e)
        }
    }

    if (!state || state.steps.length == 0)
        return <Fragment>
            No data
        </Fragment>

    let step = settings.toStep ?? 0

    if (step >= state.steps.length) {
        step = 0
    }

    const { nailIndex: srcNailIdx } = getStep(step - 1)
    const { nailIndex: dstNailIdx } = getStep(step)

    const srcNail = getNail(srcNailIdx)
    const dstNail = getNail(dstNailIdx)

    return (
        <Grid
            container
            height='100%'
            display='flex'
            flexGrow={1}
            flexDirection='column'
            direction='column'
        >
            <Grid
                item
                container
                direction='row'
                spacing={1}
            >
                <Grid item xs={3}>
                    <Stack
                        direction='row'
                        spacing={1}
                        marginTop={1}
                    >
                        <NumericInput
                            label="offset"
                            value={settings.offset}
                            onChange={v => handleChange(v, 'offset')}
                            min={0}
                            max={state.nails.length}
                            type='integer'
                            hideButtons
                            sx={{ width: '80px' }}
                        />
                        <NumericInput
                            label="thickness"
                            value={settings.thickness}
                            onChange={v => handleChange(v, 'thickness')}
                            hideButtons
                            sx={{ width: '80px' }}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    size="small"
                                    checked={settings.speech}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, speech: e.target.checked })}
                                />
                            }
                            label="speech"
                        />
                    </Stack>
                </Grid>

                <Grid
                    item
                    container
                    xs={6}
                    direction='column'
                    alignItems="center"
                    justifyContent='center' >
                    <ButtonGroup
                        size="small"
                    >
                        <Button
                            onClick={() => goToStep(0)}>
                            <FirstPage />
                        </Button>
                        <Button
                            onClick={() => goToStep(step == 0 ? state.steps.length - 1 : step - 1)}>
                            <ChevronLeft />
                        </Button>
                        <NumericInput
                            value={step + 1}
                            onChange={(v: number) => goToStep(v - 1)}
                            min={1}
                            max={state.steps.length}
                            type='integer'
                            hideButtons
                            sx={{ width: '80px' }}
                        />
                        <Button disabled sx={{ width: '60px' }}>
                            / {state.steps.length}
                        </Button>
                        <Button
                            onClick={() => goToStep(step == state.steps.length - 1 ? 0 : step + 1)}>
                            <ChevronRight />
                        </Button>
                        <Button>
                            <LastPage
                                onClick={() => goToStep(state.steps.length - 1)} />
                        </Button>
                    </ButtonGroup>
                    <Slider
                        value={[settings.fromStep, settings.toStep]}
                        onChange={(e, v) => setSettings({
                            ...settings,
                            fromStep: v[0],
                            toStep: v[1]
                        })}
                        valueLabelDisplay="auto"
                        max={state.steps.length - 1}
                        />
                </Grid>

                <Grid item xs={3}>
                    <Rating
                        size="small"
                        value={state.rating ?? 0}
                        precision={0.5}
                        onChange={(e, newValue) => handleRate(newValue ?? undefined)}>
                    </Rating>
                    {srcNail && <Typography fontSize={12} color='grey'>src: {srcNailIdx} | x:{srcNail.position.x.toFixed(2)} y:{srcNail.position.y.toFixed(2)}</Typography>}
                    {dstNail && <Typography fontSize={12} color='grey'>dst: {dstNailIdx} | x:{dstNail.position.x.toFixed(2)} y:{dstNail.position.y.toFixed(2)}</Typography>}
                </Grid>
            </Grid>

            <Grid
                item
                flexGrow={1}
                display='flex'
                justifyContent='center'
                sx={{ background: 'white' }}>
                <ThreadPreviewer
                    instructions={state}
                    showArrow={true}
                    showNails={true}
                    showNumber={true}
                    fromStep={settings.fromStep}
                    toStep={settings.toStep}
                    highlightLast={true}
                    nailOffset={settings.offset}
                    strokeWidth={settings.thickness} />
            </Grid>
        </Grid>
    )
}
