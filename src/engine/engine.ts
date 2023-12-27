import {ImageTranslateResult, TextTranslateResult} from "../models/engine";

import {Papago} from "./papago";

export const NotImplementedError = class extends Error {
    constructor(message?: string) {
        super(message)
    }
}
export const NotSupportedLanguageError = class extends Error {
    constructor(message?: string) {
        super(message)
    }
}

export const AvailableEngines = [
    {name: "papago", engine: Papago}
]

export interface TranslationEngine {
    translateText(text: string, source: string, target: string): Promise<TextTranslateResult>;
    translateImage(image: Blob, source: string, target: string): Promise<ImageTranslateResult>;
}

export const getEngine = async (): Promise<TranslationEngine> => {
    const config = await chrome.storage.local.get(['engine'])
    let engine = config.engine
    if (!engine) {
        engine = 'papago'
        await chrome.storage.local.set({engine: engine})
    }

    const engineClass = AvailableEngines.find((engine) => engine.name === config.engine)
    if (!engineClass) {
        throw new NotImplementedError(`Engine ${engine} is not implemented`)
    }
    return new engineClass.engine()
}