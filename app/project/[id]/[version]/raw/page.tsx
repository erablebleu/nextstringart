'use server'

import { IdParameters } from "@/app/parameters"
import JsonEditor from "@/components/jsonEditor"

export type Parameters = IdParameters & {
    version: string
}

export default async function ({ params }: { params: Promise<Parameters> }) {
    const projectId = (await params).id
    const projectVersion = (await params).version

    return (
        <JsonEditor
            url={`/api/project/${projectId}/${projectVersion}/settings`}
            saveUrl={`/api/project/${projectId}`}
            saveMethod="POST"
        >
        </JsonEditor>
    )
}