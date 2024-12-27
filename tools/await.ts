export class Await {
    public static delay(delay: number) {
        return new Promise(resolve => setTimeout(resolve, delay))
    }
}