'use client'

import React from "react"
import { IdParameters } from "@/app/parameters"
import Stepper from "@/components/stepper"
import { CalculationJobInfo } from "@/tools/calculation"
import { LinearProgress } from "@mui/material"

export type Parameters = IdParameters & {
    version: string
}

export default function ({ params }: { params: Parameters }) {
    const projectId = params.id
    const projectVersion = params.version

    const [state, setState] = React.useState<{
        calculationInfo?: CalculationJobInfo
    } | undefined>()

    React.useEffect(() => {
        load()

        async function load() {
            const response = await fetch(`/api/project/${projectId}/${projectVersion}/calculation`, { method: 'GET' })

            const calculationInfo: CalculationJobInfo | undefined = await response?.json()

            setState({
                calculationInfo
            })
        }
    }, [projectId, projectVersion])

    if (!state) {
        return <React.Fragment>
            Loading
        </React.Fragment>
    }

    if (state.calculationInfo?.progress !== undefined && state.calculationInfo.progress < 1) {
        return <React.Fragment>
            <LinearProgress variant="determinate" value={state.calculationInfo.progress * 100}
                sx={{ width: '100%' }} />
        </React.Fragment>
    }
    else {
        return <Stepper
            projectId={projectId}
            projectVersion={projectVersion}>
        </Stepper>
    }
}