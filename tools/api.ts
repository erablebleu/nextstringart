import { NextRequest, NextResponse } from "next/server";

export class APINextResponse {
    public static Success = new NextResponse(null, { status: 200 })
}

export function withMiddleware(fn: (request: NextRequest, ...args: any[]) => Promise<NextResponse>) {
    return async function (request: NextRequest, ...args: any[]) {
        try {
            return await fn(request, ...args);
        } catch (e) {
            console.error(e)
            return NextResponse.json(`${e}`, { status: 500 })
        }
    }
}