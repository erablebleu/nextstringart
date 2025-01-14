'use client'

import React from "react";
import { IdParameters } from "@/app/parameters";
import JsonEditor from "@/components/jsonEditor";
import { Button, ButtonGroup } from "@mui/material";
import { Delete } from "@mui/icons-material";
import { fetchAndThrow } from "@/tools/fetch";
import { enqueueSnackbar } from "notistack";
import { Action } from "@/app/action";
import { useRouter } from "next/navigation";

export default function ({ params }: { params: IdParameters }) {
    const id = params.id
    const router = useRouter()

    async function handleDelete() {
        try {
            if (!await Action.askConfirmation(`Do you want to delete the frame ?`))
                return

            await fetchAndThrow(`/api/frame/${id}`, { method: 'DELETE' })
            router.push('/')
        }
        catch (e) {
            enqueueSnackbar('Deletion error', { variant: 'error' })
        }
    }

    return (
        <React.Fragment>
            {id && <JsonEditor
                url={`/api/frame/${id}`}
            >
                <Button
                    color='error'
                    onClick={(handleDelete)}
                    endIcon={<Delete />}>
                    Delete Frame
                </Button>
            </JsonEditor>}
        </React.Fragment>
    )
}