export namespace LocalStorage {
    export function get<T>(key: string): T | undefined {
        const json = window.localStorage.getItem(key)

        if (!json)
            return undefined

        return JSON.parse(json)
    }

    export function set<T>(key: string, value: T) {
        window.localStorage.setItem(key, JSON.stringify(value))
    }
}