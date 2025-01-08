'use client'

import Stepper from "@/components/stepper"
import useProject from "@/hooks/useProject"
import { Button, Typography } from "@mui/material"
import { useRouter, useSearchParams } from "next/navigation"
import React from "react"

export default function () {
    const searchParams = useSearchParams()

    const uuid: string = searchParams.get('uuid')!
    const [project] = useProject(uuid)

    return (
        <React.Fragment>
            {project && <Stepper uuid={uuid} nails={project.nailMap.nails} steps={project.steps} />}
            {!project && <Typography>No Project</Typography>}
        </React.Fragment>
    )
}