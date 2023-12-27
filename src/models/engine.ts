export interface TextTranslateResult {
    source: string;
    target: string;
    translatedText: string;

    engine: string;
}

export interface ImageTranslateResult {
    source: string;
    target: string;
    translatedImage: string;

    engine: string;
}