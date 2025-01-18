'use server'

import JsonEditor from "@/components/jsonEditor"

export default async function () {
    return (
        <JsonEditor url='/api/machine/settings' />
    )
}