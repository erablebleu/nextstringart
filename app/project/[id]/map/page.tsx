'use server'

import { IdParameters } from "@/app/parameters"
import Mapper from "@/components/mapper"
import React from "react"

export default async function ({ params }: { params: Promise<IdParameters> }) {
    const id = (await params).id

    return (
        <Mapper
            projectId={id} >
        </Mapper>
    )
}