import React from "react"
import MainLayout from "@/components/mainLayout";
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {

    return (
        <html lang='en' suppressHydrationWarning={true}>
            <head>
                <title>nextstringart</title>
            </head>
            <body>
                <Providers>
                    <MainLayout>
                        {children}
                    </MainLayout>
                </Providers>
            </body>
        </html>
    )
}
