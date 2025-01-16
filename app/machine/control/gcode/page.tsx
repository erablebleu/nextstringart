'use client'

import { Box, Button, ButtonGroup } from "@mui/material";
import React from "react";
import { Editor } from "@monaco-editor/react";
import { useLocalStorage } from "@/hooks";
import { Send } from "@mui/icons-material";
import { fetchAndThrow } from "@/tools/fetch";
import { enqueueSnackbar } from "notistack";

export default function () {
    const [gcode, setGCode] = useLocalStorage('machine.control.gcode', `G28 Z
G28 X Y
G91`)

    async function handleSendGCode() {
        try {
            fetchAndThrow('/api/machine/job/gcode', {
                method: 'POST',
                body: gcode
            })

            enqueueSnackbar('gcode successfully sent', { variant: 'success' })
        }
        catch (e) {
            enqueueSnackbar('Error sending gcode', { variant: 'error' })
            console.error(e)
        }
    }

    return (
        <Box
            height='100%'
            flexGrow={1}
            display='flex'
            flexDirection='column'
        >
            <ButtonGroup
                sx={{ marginBottom: 1 }}>
                <Button
                    color="success"
                    onClick={handleSendGCode}
                    endIcon={<Send />}>
                    Send GCode
                </Button>
            </ButtonGroup>
            <Editor
                theme='vs-dark'
                defaultLanguage='gcode'
                options={{ automaticLayout: true }}
                value={gcode}
                onChange={(value) => setGCode(value ?? '')} />
        </Box>
    )
}