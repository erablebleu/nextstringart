'use client'

import { IdParameters } from "@/app/parameters"
import ThreadSettings from "@/components/threadSettings"
import { useData } from "@/hooks"
import { CalculationMethod, Entity, Frame, ProjectHelper, ProjectSettings, Thread } from "@/model"
import { fetchAndThrow } from "@/tools/fetch"
import { ExpandMore, Save } from "@mui/icons-material"
import { Accordion, AccordionDetails, AccordionSummary, Button, ButtonGroup, FormControl, InputLabel, ListItemText, MenuItem, Select, Stack, Typography } from "@mui/material"
import { enqueueSnackbar } from "notistack"
import { Fragment, use } from "react"

export type Parameters = IdParameters & {
    version: string
}

export default function ({ params }: { params: Promise<Parameters> }) {
    const { id: projectId, version: projectVersion } = use(params)
    const [projectSettings, setProjectSettings] = useData<ProjectSettings>(`/api/project/${projectId}/${projectVersion}/settings`)
    const [frames] = useData<Array<Frame & Entity>>(`/api/frame`)

    async function handleSave() {
        try {
            await fetchAndThrow(`/api/project/${projectId}`, {
                method: 'POST',
                body: JSON.stringify(projectSettings),
            })

            enqueueSnackbar('Data saved', { variant: 'success' })
        }
        catch (e) {
            console.error(e)
            enqueueSnackbar('Error saving data', { variant: 'error' })
        }
    }

    async function handleCalculationMethodChanged(calculationMethod: CalculationMethod) {
        setProjectSettings({
            ...projectSettings!,
            calculationMethod,
        })
    }

    async function handleFrameChange(frameId: string) {
        console.log('handleFrameChange')
        if (!projectSettings)
            return

        setProjectSettings({
            ...projectSettings,
            frameId: frameId
        })
    }

    if (!projectSettings || !frames)
        return <Fragment>
            Loading ...
        </Fragment>

    return (
        <Stack
            height='100%'
            flexGrow={1}
            display='flex'
            flexDirection='column'
            direction='column'
            spacing={1}>
            <Stack
                direction='row'
                spacing={1}
            >
                <ButtonGroup
                    size="small"
                    variant="outlined"
                    sx={{ marginBottom: 2 }}>
                    <Button
                        color="success"
                        onClick={handleSave}
                        endIcon={<Save />}>
                        Save
                    </Button>
                    <Button onClick={(e) => setProjectSettings({
                        ...projectSettings,
                        threads: [...projectSettings.threads, ProjectHelper.defaultThread()],
                    })}>
                        Add Thread
                    </Button>
                </ButtonGroup>
            </Stack>

            <Stack
                spacing={1}
                height='100%'
                flexGrow={1}
                sx={{ overflowY: 'auto' }}>

                <Accordion
                    disableGutters={true}
                    defaultExpanded={true}>
                    <AccordionSummary
                        expandIcon={<ExpandMore />} >
                        <Typography variant="h5">Global</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Stack
                            spacing={2}>

                            <FormControl fullWidth>
                                <InputLabel
                                    id="calculation-method-label">
                                    Calculation method
                                </InputLabel>
                                <Select
                                    labelId="calculation-method-label"
                                    label="Calculation method"
                                    size="small"
                                    value={projectSettings.calculationMethod}
                                    onChange={(e) => handleCalculationMethodChanged(e.target.value as CalculationMethod)}>
                                    {[CalculationMethod.delta, CalculationMethod.mri].map((item: CalculationMethod) =>
                                        <MenuItem key={item} value={item}>{item}
                                        </MenuItem>)}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel
                                    id="frame-label">
                                    Frame
                                </InputLabel>
                                <Select
                                    labelId="frame-label"
                                    label="Frame"
                                    size="small"
                                    value={projectSettings.frameId}
                                    onChange={(e) => handleFrameChange(e.target.value as string)}
                                >
                                    {frames?.map((x: Frame & Entity) => (
                                        <MenuItem key={x.id} value={x.id}>
                                            <ListItemText
                                                primary={x.name}
                                                secondary={x.description} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </AccordionDetails>
                </Accordion>


                {projectSettings.threads.map((thread: Thread, index: number) => (
                    <Accordion
                        key={`thread_${index}`}
                        disableGutters={true}
                        defaultExpanded={true}>
                        <AccordionSummary
                            expandIcon={<ExpandMore />} >
                            <div style={{
                                width: "25px",
                                height: "25px",
                                borderRadius: "5px",
                                backgroundColor: thread.color,
                                marginRight: "20px"
                            }} />
                            <Typography variant="h5">{thread.description} - {thread.maxStep} steps - {thread.calculationThickness} mm</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <ThreadSettings
                                data={thread}
                                onChange={(newValue: Thread) => setProjectSettings({
                                    ...projectSettings,
                                    threads: projectSettings.threads.map(t => t == thread ? newValue : t)
                                })}
                                onDelete={() => setProjectSettings({
                                    ...projectSettings,
                                    threads: projectSettings.threads.filter(t => t != thread)
                                })} />
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Stack>
        </Stack>
    )
}