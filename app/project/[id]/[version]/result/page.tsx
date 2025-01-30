'use client'

import { Fragment, use } from "react"
import { IdParameters } from "@/app/parameters"
import Stepper from "@/components/stepper"
import { LinearProgress, Stack, Typography } from "@mui/material"
import useSWR from "swr"
import { CalculationJobInfo } from "@/tools/calculation/calculationJob"

export type Parameters = IdParameters & {
    version: string
}

const fetcher = (url: URL) => fetch(url, { method: 'GET' }).then(r => r.json())

export default function ({ params }: { params: Promise<Parameters> }) {
    const { id: projectId, version: projectVersion } = use(params)
    const { data, mutate, isLoading } = useSWR<CalculationJobInfo & CalculationJobInfo>(`/api/project/${projectId}/${projectVersion}/versioninfo`, fetcher, {
        refreshInterval: d => d?.progress === undefined ? 0 : 500,
        dedupingInterval: 500,
    })

    if (isLoading || !data) {
        return (
            <Fragment>
                Loading
            </Fragment>
        )
    }
    if (data.progress === undefined) {
        return (
            <Stepper
                projectId={projectId}
                projectVersion={projectVersion}>
            </Stepper>
        )
    }

    return (
        <Stack
            margin={1}
            spacing={1}>
            <LinearProgress variant="determinate" value={data.progress * 100}
                sx={{ width: '100%' }} />
            <Typography>thread: {data.threadIndex + 1} / {data.threadCount}</Typography>
            <Typography>step: {data.stepIndex + 1} / {data.stepCount}</Typography>
        </Stack>
    )
}