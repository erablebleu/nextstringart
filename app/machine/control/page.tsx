'use server'

import { redirect } from "next/navigation";

export default async function () {
    redirect(`/machine/control/json`)
}