'use server'

import { IdParameters } from "@/app/parameters"
import Mapper from "@/components/mapper"

export type Parameters = IdParameters & {
    version: string
}

export default async function ({ params }: { params: Promise<Parameters> }) {
    const projectId = (await params).id
    const projectVersion = (await params).version

    return (
        <Mapper
            projectId={projectId}
            projectVersion={projectVersion} >
        </Mapper>
    )
}