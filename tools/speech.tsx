const synth = typeof window !== "undefined" ? window?.speechSynthesis : undefined

export class Speech {
    public static say(text: string) {
        synth?.speak(new SpeechSynthesisUtterance(text))
    }
}