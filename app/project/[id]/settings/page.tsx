'use client'

import { IdParameters } from "@/app/parameters"
import ThreadSettings from "@/components/threadSettings"
import { useData } from "@/hooks"
import { Project, Thread } from "@/model"
import { fetchAndThrow } from "@/tools/fetch"
import { ExpandMore, Save } from "@mui/icons-material"
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, ButtonGroup, Grid, Typography } from "@mui/material"
import { enqueueSnackbar } from "notistack"
import React from "react"

export default function ({ params }: { params: IdParameters }) {
    const id = params.id
    const apiUrl = `/api/project/${id}`
    const [project, setProject] = useData<Project>(`/api/project/${id}`)
    const threadData = React.useRef<Array<Uint8ClampedArray | null>>([])

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

    if (!project)
        return <React.Fragment>Loading ...</React.Fragment>

    return (
        <Box
            height='100%'
            flexGrow={1}
            display='flex'
            flexDirection='column'>
            <Box
                sx={{ marginBottom: 1 }}
            >
                <ButtonGroup variant="outlined" sx={{ marginBottom: 2 }}>
                    <Button
                        color="success"
                        onClick={handleSave}
                        endIcon={<Save />}>
                        Save
                    </Button>
                    <Button onClick={(e) => setProject({
                        ...project,
                        threads: project.threads.concat([new Thread])
                    })}>Add Thread</Button>
                </ButtonGroup>
            </Box>
            <Box
                height='100%'
                flexGrow={1}
                sx={{ overflowY: 'auto' }}>

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
                                })}
                                onImageChange={(data: Uint8ClampedArray) => threadData.current = project.threads.map((t: Thread, i: number) => t == thread ? data : threadData.current.length > i ? threadData.current[i] : null)} />
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        </Box>
    )
}