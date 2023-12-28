import ko_KR from './ko-KR.json'
import en_US from './en-US.json'

import {normalizeLanguageCode} from "../utils/utils.ts";

const LanguageLocal: Record<string, string> = {
    'ko-KR': '한국어',
    'en-US': 'English',
    'ja-JP': '日本語',
    'zh-CN': '中文',
    'zh-TW': '中文',
    'vi-VN': 'Tiếng Việt',
    'id-ID': 'Bahasa Indonesia',
    'th-TH': 'ภาษาไทย',
    'de-DE': 'Deutsch',
    'ru-RU': 'Русский',
    'es-ES': 'Español',
    'it-IT': 'Italiano',
    'fr-FR': 'Français',
}

const messages: Record<string, Record<string, string>> = {
    'ko-KR': ko_KR,
    'en-US': en_US,
}

export const translatePage = () => {
    document.querySelectorAll('[data-translate]').forEach((element) => {
        const id = `@page/${element.getAttribute('data-translate')}`;
        if (id) {
            if (messages[normalizeLanguageCode(navigator.language)]) {
                // @ts-ignore
                element.innerText = messages[normalizeLanguageCode(navigator.language)][id]
            } else {
                // @ts-ignore
                element.innerText = messages['en-US'][id]
            }
        }
    })
}

export const i18n = async (id: string, ...arg: any) => {
    const normalizedCode = normalizeLanguageCode(navigator.language)
    console.log(normalizedCode, id)
    if (messages[normalizedCode] && messages[normalizedCode][id]) {
        return format(messages[normalizedCode][id], arg)
    } else {
        return format(messages['en-US'][id], arg)
    }
}

const format = async (text: string, args: any[]) => {
    let index = 0
    while (true) {
        console.log(text.substring(index), args)
        let p = text.substring(index).indexOf('%')

        if (p === -1) {
            break
        }

        // %%
        if (text[p+1] === '%') {
            text = text.slice(0, p) + text.slice(p+1)
            index = p + 1
            continue
        }

        // %s
        if (text[p+1] === 's') {
            let arg = args.shift()
            if (typeof arg === 'string') {
                text = text.slice(0, p) + arg + text.slice(p+2)
            } else {
                text = text.slice(0, p) + "[INVALID FORMATTER]" + text.slice(p+2)
            }
        }

        // %d
        if (text[p+1] === 'd') {
            let arg = args.shift()
            if (typeof arg === 'number') {
                text = text.slice(0, p) + arg + text.slice(p+2)
            } else {
                text = text.slice(0, p) + "[INVALID FORMATTER]" + text.slice(p+2)
            }
        }

        // %lang
        if (text.substring(p+1, p+5) === 'lang') {
            const config = await chrome.storage.local.get(['target_lang']);

            if (messages[normalizeLanguageCode(navigator.language)] && messages[normalizeLanguageCode(navigator.language)][`@lang/${config.target_lang}`]) {
                text = text.slice(0, p) + LanguageLocal[normalizeLanguageCode(navigator.language)] + text.slice(p+5)
            } else if (LanguageLocal[normalizeLanguageCode(navigator.language)]) {
                text = text.slice(0, p) + LanguageLocal[normalizeLanguageCode(navigator.language)] + text.slice(p+5)
            } else {
                text = text.slice(0, p) + config.target_lang + text.slice(p+5)
            }
        }

        index = p + 1
    }

    return text
}