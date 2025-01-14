import { Grid } from "@mui/material";
import React from "react";
import JsonEditor from "@/components/jsonEditor";
import MachineControl from "@/components/machineControl";
import { MachineInfo } from "@/tools/machine/machineInfo";
import { machine } from "@/tools/api";

export default async function () {
    const machineInfo: MachineInfo = machine.getInfo()

    return (
        <React.Fragment>
            <Grid container spacing={2}>

                <Grid item xs={12} >
                    <MachineControl machineInfo={machineInfo} />
                </Grid>

                <Grid item xs={12} container direction='column' height='300px' >
                    <JsonEditor url='/api/machine/settings' />
                </Grid>

            </Grid>

        </React.Fragment>
    )
}