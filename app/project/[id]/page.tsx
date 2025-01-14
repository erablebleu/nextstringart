'use server'

import { IdParameters } from "@/app/parameters"
import { redirect } from "next/navigation"

export default async function ({ params }: { params: Promise<IdParameters> }) {
    const id = (await params).id

    redirect(`/project/${id}/raw`)
}