import Stepper from "@/components/stepper"
import useProject from "@/hooks/useProject"
import { Button, Typography } from "@mui/material"
import { useRouter } from "next/router"
import React from "react"

export default function () {
    const router = useRouter()
    const uuid: string = router.query.uuid as string
    const [project] = useProject(uuid)

    return (
        <React.Fragment>
            {project && <Stepper uuid={uuid} nails={project.nailMap.nails} steps={project.steps} />}
            {!project && <Typography>No Project</Typography>}
        </React.Fragment>
    )
}