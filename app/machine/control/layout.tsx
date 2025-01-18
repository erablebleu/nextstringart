'use client'

import { Box, Stack, Tab, Tabs } from "@mui/material";
import React from "react";
import MachineControl from "@/components/machineControl";
import { usePathname, useRouter } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const tab = pathname.split('/').at(-1)

    async function handleTabChange(event: React.SyntheticEvent, tab: string) {
        router.push(`/machine/control/${tab}`)
    }

    return (
        <Box
            height='100%'
            width='100%'
            display='flex'
            flexDirection='row'
        >
            <Stack
                width='50%'
                display='flex'
                flexDirection='column'
                marginRight={1}
                flexGrow={1}
                spacing={1}>
                <MachineControl/>
            </Stack>
            <Box
                width='50%'
                display='flex'
                flexDirection='column'
                flexGrow={1}>
                <Tabs
                    value={tab}
                    onChange={handleTabChange}
                    sx={{ marginBottom: 1 }}>
                    <Tab value="settings" label="Settings" />
                    <Tab value="json" label="From Json" />
                    <Tab value="gcode" label="From GCode" />
                </Tabs>
                {children}
            </Box>
        </Box>
    )
}