import hmacMD5 from 'crypto-js/hmac-md5'
import hmacSHA1 from 'crypto-js/hmac-sha1'
import Base64 from 'crypto-js/enc-base64';

import { v4 } from 'uuid'
import {TranslationEngine} from "./engine";

import {ImageTranslated, Translated, TranslationError} from "../models/papago";
import {ImageTranslateResult, TextTranslateResult} from "../models/engine";
import {UnretryableError} from "../utils/utils";

export const ERROR_CODES = {
    "HMAC_ERROR": "024",
    "NO_CHAR_DETECTED": "OCR12",
}

const language: Record<string, string> = {
    "auto": "auto",
    "ko_KR": "ko",
    "en_US": "en",
    "ja_JP": "ja",
    "zh_CN": "zh-CN",
    "zh_TW": "zh-TW",
    "vi_VN": "vi",
    "id_ID": "id",
    "th_TH": "th",
    "de_DE": "de",
    "ru_RU": "ru",
    "es_ES": "es",
    "it_IT": "it",
    "fr_FR": "fr",
}

const version = 'v1.7.9_ee61e6111a'
const deviceID = v4()


const padAppHash = async (url: string) => {
    const timeStampMilli = Date.now()
    const pad = Base64.stringify(hmacSHA1(`${url}${timeStampMilli}`, 'aVwDprJBYvnz1NBs8W7GBuaHQDeoynolGF5IdsxyYP6lyCzxAOG38hleJo43NnB6'))
    return `${url}?msgpad=${timeStampMilli}&md=${pad}`
}
const padWebHash = (url: string) => {
    const timeStampMilli = Date.now()
    let hash = Base64.stringify(hmacMD5(`${deviceID}\n${url}\n${timeStampMilli}`, version))
    return {
        'Authorization': `PPG ${deviceID}:${hash}`,
        'device-type': 'pc',
        'deviceId': deviceID,
        'timestamp': `${timeStampMilli}`
    }
}

export const detectLang = async (text: string) => {
    const res = await fetch(`https://papago.naver.com/apis/langs/dect`, {
        method: 'POST',
        headers: {
            ...padWebHash('https://papago.naver.com/apis/langs/dect'),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `query=${encodeURIComponent(text)}`
    })
    return (await res.json()).langCode
}
export const translate = async (text: string, source: string, target: string) => {
    chrome.storage.local.get(['translated_text_count'], (res) => {
        if (!res.translated_text_count) {
            res.translated_text_count = 0
        }
        chrome.storage.local.set({
            translated_text_count: res.translated_text_count + 1
        })
    })

    const config = await chrome.storage.local.get(['honorific'])
    const res = await fetch(`https://papago.naver.com/apis/n2mt/translate`, {
        method: 'POST',
        headers: {
            ...padWebHash('https://papago.naver.com/apis/n2mt/translate'),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `deviceId=${deviceID}&locale=${source}&agree=false&dict=false&dictDisplay=30&honorific=${config.honorific}&instant=true&paging=false&source=${source}&target=${target}&text=${text}`
    })
    return await res.json() as Translated
}
export const translateImage = async (blob: Blob, source: string, target: string) => {
    chrome.storage.local.get(['translated_image_count'], (res) => {
        if (!res.translated_image_count) {
            res.translated_image_count = 0
        }
        chrome.storage.local.set({
            translated_image_count: res.translated_image_count + 1
        })
    })

    const formData = new FormData()
    formData.append('image', blob, 'image')
    formData.append('source', source)
    formData.append('target', target)

    let res = await fetch(await padAppHash('https://apis.naver.com/papago/papago_app/ocr/detect'), {
        method: 'POST',
        body: formData
    })

    let response = await res.json()
    if (res.status >= 400) {
        response = response as TranslationError
        if (response.errorCode === ERROR_CODES.NO_CHAR_DETECTED) {
            throw new UnretryableError(response.errorMessage)
        }
        throw new Error(`Failed to translate image: ${response.errorCode}/${response.errorMessage}`)
    }
    response = response as ImageTranslated
    return `data:image/png;base64,${response.renderedImage}`
}

export class Papago implements TranslationEngine {
    async translateText(text: string, source: string, target: string) {
        if (language[source] === undefined|| language[target] === undefined) {
            throw new Error(`Language ${source} or ${target} is not supported`)
        }
        let result = await translate(text, language[source], language[target])
        return {
            source: result.srcLangType,
            target: result.tarLangType,
            translatedText: result.translatedText,

            engine: "papago",
        } as TextTranslateResult
    }

    async translateImage(image: Blob, source: string, target: string) {
        if (language[source] === undefined|| language[target] === undefined) {
            throw new Error(`Language ${source} or ${target} is not supported`)
        }

        let result = await translateImage(image, language[source], language[source])
        return {
            source: source,
            target: target,
            translatedImage: result,

            engine: "papago",
        } as ImageTranslateResult
    }
}