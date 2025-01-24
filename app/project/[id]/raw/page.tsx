'use server'

import { IdParameters } from "@/app/parameters"
import JsonEditor from "@/components/jsonEditor"
import React from "react"


export default async function ({ params }: { params: Promise<IdParameters> }) {
    const projectId = (await params).id

    return (
        <JsonEditor
            url={`/api/project/${projectId}`}
        >
        </JsonEditor>
    )
}