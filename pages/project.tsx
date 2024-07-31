import React from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, ButtonGroup, Stack, Tab, Tabs, Typography } from "@mui/material";
import { Thread } from "@/model/project";
import { ExpandMore } from "@mui/icons-material";
import Mapper from "@/components/mapper";
import ThreadSettings from "@/components/threadSettings";
import { NailMap } from "@/model/nailMap";
import CalculatorView from "@/components/calculatorView";
import useProject from "@/hooks/useProject";
import { useRouter } from "next/router";
import { IStep } from "@/model/instructions";
import Stepper from "@/components/stepper";

export default function () {
    const router = useRouter()
    const uuid: string = router.query.uuid as string
    const [project, setProject] = useProject(uuid)
    const tab = router.query.tab ?? 'threads'
    const threadData = React.useRef<Array<Uint8ClampedArray | null>>([])

    if (!project) {
        return (<Typography>No Project</Typography>)
    }

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        router.replace({
            query: { ...router.query, tab: newValue },
        })
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Tabs value={tab} onChange={handleTabChange}>
                <Tab value="threads" label="Threads" />
                <Tab value="map" label="Map" />
                <Tab value="calculation" label="Claculation" />
                <Tab value="stepper" label="Stepper" />
            </Tabs>

            { /* Collapsed because used to render threadData */ }
            <Box sx={{
                visibility: tab == 'threads' ? 'visible' : 'collapse',
                position: tab == 'threads' ? 'block' : 'fixed',
                }}>
                <ButtonGroup variant="outlined" sx={{ marginBottom: 2 }}>
                    <Button onClick={(e) => setProject({
                        ...project,
                        threads: project.threads.concat([new Thread])
                    })}>Add Thread</Button>
                </ButtonGroup>
                {project.threads.map((thread: Thread, index: number) => (
                    <Accordion key={`thread_${index}`} disableGutters={true} defaultExpanded={true}>
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

            {tab == 'map' && <React.Fragment>
                <Mapper
                    imageData={project.threads.length > 0 ? project.threads[0].imageInfo.imageData : undefined}
                    onChange={(newValue: NailMap) => setProject({
                        ...project,
                        nailMap: newValue
                    })}
                    nailMap={project.nailMap} />
            </React.Fragment>
            }

            {tab == 'calculation' && <React.Fragment>
                <CalculatorView
                    project={project}
                    // imageDatas={threadData}
                    imageDatas={threadData}
                    onChange={(result: IStep[]) => setProject({
                        ...project,
                        steps: result
                    })} />
                <Stepper uuid={uuid} nails={project.nailMap.nails} steps={project.steps} />
            </React.Fragment>
            }

            {tab == 'stepper' && <React.Fragment>
                <Stepper uuid={uuid} nails={project.nailMap.nails} steps={project.steps} />
            </React.Fragment>
            }
        </Box>
    )
}