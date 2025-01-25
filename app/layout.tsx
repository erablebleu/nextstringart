import { ReactNode } from "react"
import MainLayout from "@/components/mainLayout"
import { Providers } from "./providers"
import '../styles/global.css'

export default function RootLayout({ children }: { children: ReactNode }) {
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
