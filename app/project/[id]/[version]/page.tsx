'use server'

import { IdParameters } from "@/app/parameters"
import { redirect } from "next/navigation"

export type Parameters = IdParameters & {
    version: string
}

export default async function ({ params }: { params: Promise<Parameters> }) {
    const projectId = (await params).id
    const projectVersion = (await params).version

    redirect(`/project/${projectId}/${projectVersion}/raw`)
}