'use client'

import { Button } from "@mui/material";
import { CloseReason, closeSnackbar, enqueueSnackbar, SnackbarKey } from "notistack";

export class Action {
    public static async try<T>(action: () => Promise<T>, errorMessage?: string): Promise<T | undefined> {
        try {
            return await action()
        }
        catch (e: any) {
            enqueueSnackbar(errorMessage ?? `${e}`, { variant: 'error' })
        }
    }

    public static async askConfirmation(message: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            enqueueSnackbar(message, {
                action: (snackbarId: SnackbarKey) => (
                    <Button
                        color="warning"
                        onClick={() => {
                            resolve(true)
                            closeSnackbar(snackbarId)
                        }}>
                        Confirm
                    </Button>
                ),
                onClose: (event, reason: CloseReason) => {
                    if(reason != 'instructed')
                        resolve(false)
                },
            })
        })
    }
}
