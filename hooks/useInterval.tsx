import React from 'react';

export function useInterval(callback: () => Promise<void>, delay: number) {
    const savedCallback = React.useRef<() => Promise<void>>()

    React.useEffect(() => {
        savedCallback.current = callback
    }, [callback])

    React.useEffect(() => {

        async function tick() {
            await savedCallback.current?.()
        }

        if (delay !== null) {
            let id = setInterval(tick, delay)
            return () => clearInterval(id)
        }
    }, [delay])
}