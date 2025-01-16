'use client'

import { Box, Button, ButtonGroup } from "@mui/material";
import React from "react";
import { Editor } from "@monaco-editor/react";
import { useLocalStorage } from "@/hooks";
import { Send } from "@mui/icons-material";
import { fetchAndThrow } from "@/tools/fetch";
import { enqueueSnackbar } from "notistack";

export default function () {
    const [json, setJson] = useLocalStorage('machine.control.json', `{
    "zLow": 35,
    "zHigh": 20,
	"nails": [
            {
                "diameter": 1.8,
                "position": {
                    "x": 394.04155872192,
                    "y": 0
                }
            },
            {
                "diameter": 1.8,
                "position": {
                    "x": 387.979380895429,
                    "y": 3.5
                }
            }
        ],
        
    "steps": [
        {
            "nailIndex": 1,
            "direction": 0
        }
    ]
}`)

    async function handleSendJson() {
        let instructions = undefined

        try {
            instructions = JSON.parse(json)
        }
        catch (e) {
            enqueueSnackbar('Error parsing json', { variant: 'error' })
            console.error(e)
            return
        }

        try {
            fetchAndThrow('/api/machine/job/json', {
                method: 'POST',
                body: json
            })

            enqueueSnackbar('json successfully sent', { variant: 'success' })
        }
        catch (e) {
            enqueueSnackbar('Error sending json', { variant: 'error' })
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
                    onClick={handleSendJson}
                    endIcon={<Send />}>
                    Send Json
                </Button>
            </ButtonGroup>
            <Editor
                theme='vs-dark'
                defaultLanguage='json'
                options={{ automaticLayout: true }}
                value={json}
                onChange={(value) => setJson(value ?? '{}')} />
        </Box>
    )
}