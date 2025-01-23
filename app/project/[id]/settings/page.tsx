'use client'

import { IdParameters } from "@/app/parameters"
import ThreadSettings from "@/components/threadSettings"
import { useData } from "@/hooks"
import { CalculationMethod, Project, Thread } from "@/model"
import { fetchAndThrow } from "@/tools/fetch"
import { ExpandMore, Save } from "@mui/icons-material"
import { Accordion, AccordionDetails, AccordionSummary, Button, ButtonGroup, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material"
import { enqueueSnackbar } from "notistack"
import React from "react"

export default function ({ params }: { params: IdParameters }) {
    const projectId = params.id
    const apiUrl = `/api/project/${projectId}`
    const [project, setProject] = useData<Project>(`/api/project/${projectId}`)

    async function handleSave() {
        try {
            await fetchAndThrow(apiUrl, {
                method: 'POST',
                body: JSON.stringify(project),
            })

            enqueueSnackbar('Data saved', { variant: 'success' })
        }
        catch (e) {
            console.error(e)
            enqueueSnackbar('Error saving data', { variant: 'error' })
        }
    }

    async function handleCalculationMethodChanged(calculationMethod: CalculationMethod) {
        setProject({
            ...project!,
            calculationMethod,
        })
    }

    async function handleCalculate() {
        try {
            await fetchAndThrow(`/api/project/${projectId}/calculation`, { method: 'POST' })
            enqueueSnackbar('Calculation successfully started', { variant: 'success' })
        }
        catch (e) {
            console.error(e)
            enqueueSnackbar('Error starting calculation', { variant: 'error' })
        }
    }

    if (!project)
        return <React.Fragment>Loading ...</React.Fragment>

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
                    <Button onClick={(e) => setProject({
                        ...project,
                        threads: project.threads.concat([new Thread])
                    })}>
                        Add Thread
                    </Button>
                    <Button onClick={handleCalculate}>
                        Calculate
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
                        <FormControl fullWidth>
                            <InputLabel
                                id="calculation-method-label">
                                Calculation method
                            </InputLabel>
                            <Select
                                labelId="calculation-method-label"
                                label="Calculation method"
                                size="small"
                                value={project.calculationMethod}
                                onChange={(e) => handleCalculationMethodChanged(e.target.value as CalculationMethod)}>
                                {[CalculationMethod.delta, CalculationMethod.mri].map((item: CalculationMethod) =>
                                    <MenuItem key={item} value={item}>{item}
                                    </MenuItem>)}
                            </Select>
                        </FormControl>
                    </AccordionDetails>
                </Accordion>

                {project.threads.map((thread: Thread, index: number) => (
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
                                onChange={(newValue: Thread) => setProject({
                                    ...project,
                                    threads: project.threads.map(t => t == thread ? newValue : t)
                                })}
                                onDelete={() => setProject({
                                    ...project,
                                    threads: project.threads.filter(t => t != thread)
                                })} />
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Stack>
        </Stack>
    )
}