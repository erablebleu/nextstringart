'use client'

import { Home, Pause, PlayArrow, Square } from "@mui/icons-material";
import { Button, ButtonGroup, Grid, Typography } from "@mui/material";
import React from "react";

const StepsX = [-10, -1, 'home', 1, 10]
const StepsZ = [-10, -1, 'home', 1, 10]
const StepsRZ = [-10, -1, 'home', 1, 10]

function AxisControl({ steps, onClick }: { steps: any[], onClick: (value: number) => void }) {

    return <React.Fragment>
        <ButtonGroup variant="outlined">
            {steps.map(x => <Button key={`k_${x}`} onClick={() => onClick(x)}>{x === 'home' ? <Home /> : x > 0 ? `+${x}` : x}</Button>)}
        </ButtonGroup>
    </React.Fragment>
}

export default function () {
    const [machineState, setMachineState] = React.useState({state: 'online', x: 0, y: 0, z: 0})
    const state = { x: 0, z: 0, rz: 0 }


    React.useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const response: Response = await fetch('/api/machine/state', { method: 'get' })
                setMachineState(await response.json())
            }
            catch(e) {
                console.error(e)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [machineState])

    const handleClick = async (axis: string, value: any) => {
        
        const response: Response = await fetch(`/api/machine/control/move`, { 
            method: 'post', 
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ axis, value }) })
            
        if (value === 'home') {

        }
        else {

        }
        console.log('handleXHomeClick')
    }

    return (
        <React.Fragment>
            <Grid container direction='column' spacing={1}>
                <Grid item>
                    <ButtonGroup>
                        <Button><PlayArrow /></Button>
                        <Button><Pause /></Button>
                        <Button><Square /></Button>
                    </ButtonGroup>
                </Grid>

                <Grid item container direction='row'>
                    <AxisControl steps={StepsX} onClick={(value) => handleClick('x', value)} />
                    <Typography margin={1}>X= {state.x}</Typography>
                </Grid>

                <Grid item container direction='row'>
                    <AxisControl steps={StepsX} onClick={(value) => handleClick('z', value)} />
                    <Typography margin={1}>Z= {state.z}</Typography>
                </Grid>

                <Grid item container direction='row'>
                    <AxisControl steps={StepsX} onClick={(value) => handleClick('rz', value)} />
                    <Typography margin={1}>rZ= {state.rz}</Typography>
                </Grid>

                {machineState.state}
            </Grid>

        </React.Fragment>
    )
}