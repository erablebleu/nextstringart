'use client'

import { Instructions, Entity } from "@/model"
import { Box, Stack, Typography } from "@mui/material"
import React from "react"
import { CalculationJobInfo } from "@/tools/calculation"
import CalculationList from "./calculationList"
import Stepper from "./stepper"

type Options = {
    projectId: string
    projectVersion: string
}

export default function ({ projectId, }: Options) {
    const [selectedInstructions, setSelectedInstructions] = React.useState<(Instructions & Entity) | undefined>()
    const [selectedCalculation, setSelectedCalculation] = React.useState<CalculationJobInfo | undefined>()

    return (
        <Stack
            display='flex'
            flexDirection='row'
            direction='row'
            height='100%'
            width='100%'
            flexGrow={1}
            spacing={1} >
            <Stack
                height='100%'
                display='flex'
                flexDirection='column'
                direction='column'
                spacing={1} >
                <Typography>
                    Calculations
                </Typography>
                <Box
                    flexGrow={1}
                    display='flex'
                    flexDirection='column'>
                    <CalculationList
                        projectId={projectId}
                        selectedId={selectedCalculation?.id}
                        onSelected={(item) => setSelectedCalculation(item)}
                    />
                </Box>
            </Stack>
            <Stack
                flexGrow={1}
                spacing={1} >
                {selectedInstructions && <Stepper
                    projectId={projectId}
                    projectVersion={selectedInstructions.id}>
                </Stepper>
                }
            </Stack>
        </Stack>
    )
}