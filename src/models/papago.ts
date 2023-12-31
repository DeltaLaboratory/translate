export interface Translated {
    delay:          number;
    delaySMT:       number;
    srcLangType:    string;
    tarLangType:    string;
    translatedText: string;
    engineType:     string;
    langDetection:  LangDetection;
}

export interface LangDetection {
    nbests: Nbest[];
}

export interface Nbest {
    lang: string;
    prob: number;
}

export interface TranslationError {
    errorCode:    string;
    errorMessage: string;
}

export interface ImageTranslated {
    imageId:       string;
    ocrs:          Ocr[];
    detectedLang:  string;
    renderedImage: string;
    source:        string
    target:        string;
}

export interface Ocr {
    LB:   Coordinate;
    LT:   Coordinate;
    RB:   Coordinate;
    RT:   Coordinate;
    text: string;
    lang: string;
}

export interface Coordinate {
    x: number;
    y: number;
}
