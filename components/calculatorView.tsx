import { IStep } from "@/model/instructions";
import { IProject, Thread } from "@/model/project";
import { Speech } from "@/tools/speech";
import { CalculatorMessageType, ICalculatorMessage, ICalculatorProgress } from "@/workers/workers";
import { Button, ButtonGroup, Checkbox, FormControlLabel, LinearProgress, Stack, Typography } from "@mui/material";
import React from "react";

interface IOptions {
    project: IProject
    imageDatas: React.MutableRefObject<(Uint8ClampedArray | null)[]>
    onChange?: (value: IStep[]) => void
}

interface IState {
    threads: Array<boolean>
    isRunning: boolean
    progress: ICalculatorProgress
    error?: string
}

function preventClose() {
    return "Calculation is running";
}

export default function ({ project, imageDatas, onChange }: IOptions) {
    const [state, setState] = React.useState<IState>({
        threads: [],
        isRunning: false,
        progress: {
            stepIndex: 0,
            threadIndex: 0
        },
    })
    const [datas, setDatas] = React.useState(project)

    React.useEffect(() => {
        setState({
            threads: [],
            isRunning: false,
            progress: {
                stepIndex: 0,
                threadIndex: 0
            },
        })
        setDatas(project)
    }, [project])

    const end = ({ error, result }: { error?: string, result?: IStep[] }) => {
        window.onbeforeunload = null
        setState({
            ...state,
            isRunning: false,
            error: error
        })
        if (result) {
            onChange?.(result)
        }
    }

    const start = async () => {
        if (state.isRunning) return

        const worker = new Worker(new URL('../workers/calculator', import.meta.url))

        worker.onmessage = (event: MessageEvent<ICalculatorMessage>) => {
            switch (event.data.type) {
                case CalculatorMessageType.Progress:
                    setState({
                        ...state,
                        isRunning: true,
                        progress: event.data.value
                    })
                    break

                case CalculatorMessageType.Result:
                    end({ result: event.data.value })
                    console.log('Result received from worker: ', event.data)
                    Speech.say(`Terre mie nez.`)
                    break
            }
        }

        worker.onerror = (event: ErrorEvent) => {
            end({ error: event.error })
            console.log('🍎 Unexpected error: ', event)
        }

        setDatas(project)
        setState({
            ...state,
            isRunning: true,
            error: undefined,
            progress: {
                stepIndex: 0,
                threadIndex: 0
            }
        })
        window.onbeforeunload = preventClose

        worker.postMessage({
            project,
            imageDatas: project.threads.map((thread: Thread, index: number) => imageDatas.current[index]!),
            threads: state.threads,
        })
    }

    const progress = 100 * state.progress.stepIndex / datas.threads[state.progress.threadIndex].maxStep

    return (
        <Stack >
            {!state.isRunning &&
                <React.Fragment>
                    {project.threads.map((thread: Thread, index: number) => (
                        <FormControlLabel
                            key={`cb_${index}`}
                            control={<Checkbox checked={state.threads.length > index ? state.threads[index] : true}
                                onChange={(event) => setState({
                                    ...state,
                                    threads: project.threads.map((t: Thread, i: number) => index == i ? event.target.checked : i < state.threads.length ? state.threads[i] : true)
                                })} />} label={thread.description} />
                    ))}
                    <ButtonGroup variant="outlined" sx={{ marginBottom: 2 }}>
                        <Button onClick={async () => start()}>Start</Button>
                    </ButtonGroup>
                </React.Fragment>
            }
            {state.isRunning &&
                <React.Fragment>
                    <Typography>
                        Thread: {state.progress.threadIndex + 1} / {datas.threads.length}
                    </Typography>
                    <Typography>
                        Step: {state.progress.stepIndex + 1} / {datas.threads[state.progress.threadIndex].maxStep}
                    </Typography>
                    <Typography>
                        Progress: {progress.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                    </Typography>
                    <Stack direction="column">
                        <LinearProgress variant="determinate" value={progress} />
                    </Stack>
                </React.Fragment>
            }
        </Stack>
    )
}