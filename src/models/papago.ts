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
