'use client'

import { Action } from "@/app/action"
import { fetchAndThrow } from "@/tools/fetch"
import { Editor } from "@monaco-editor/react"
import { Save } from "@mui/icons-material"
import { Box, Button, ButtonGroup } from "@mui/material"
import { enqueueSnackbar } from "notistack"
import { ReactNode, useEffect, useState } from "react"

export type JsonEditorParameters = {
    url: string
    saveUrl?: string
    saveMethod?: string
    value?: string
    onValueChanged?: (value: string) => void
    children?: ReactNode
}

export default function ({ children, url, saveUrl, saveMethod, value, onValueChanged }: JsonEditorParameters) {
    const [state, setState] = useState({
        isLoaded: false,
        value: value ?? '',
        initialValue: value ?? '',
        canSave: false
    })

    if (!value) {
        useEffect(() => {
            Action.try(async () => {
                const result = await fetchAndThrow(url, { method: 'GET' })
                const data = await result.json()
                const json = JSON.stringify(data, null, 4)

                setState({
                    isLoaded: true,
                    value: json,
                    initialValue: json,
                    canSave: false
                })
            })
        }, [])
    }

    function handleChange(value: string | undefined) {
        value ??= ''
        setState({
            ...state,
            value: value,
            canSave: value != state.initialValue,
        })
        onValueChanged?.(value)
    }

    async function handleSave() {
        const value = state.value
        let data: any

        try {
            data = JSON.parse(value)
        }
        catch (e) {
            console.error(e)
            enqueueSnackbar('Error parsing settings', { variant: 'error' })
            return
        }

        try {
            await fetchAndThrow(saveUrl ?? url, {
                method: saveMethod ?? 'PUT',
                body: value,
            })

            enqueueSnackbar('Data saved', { variant: 'success' })
            setState({
                ...state,
                value: value,
                initialValue: value,
                canSave: false,
            })
        }
        catch (e) {
            console.error(e)
            enqueueSnackbar('Error saving data', { variant: 'error' })
        }
    }

    return (
        <Box
            display='flex'
            flexDirection='column'
            flexGrow={1}>
            <Box
                display='flex'
                sx={{ marginBottom: 1 }}>
                <ButtonGroup>
                    <Button
                        color="success"
                        onClick={handleSave}
                        disabled={!state.canSave}
                        endIcon={<Save />}>
                        Save
                    </Button>
                </ButtonGroup>
                <Box flexGrow={1}></Box>
                <ButtonGroup>
                    {children}
                </ButtonGroup>
            </Box>
            <Editor
                theme='vs-dark'
                defaultLanguage='json'
                options={{ automaticLayout: true }}
                value={state.value}
                onChange={handleChange} />
        </Box>
    )
}