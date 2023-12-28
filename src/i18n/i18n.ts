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
    const lc = normalizeLanguageCode(navigator.language)

    document.querySelectorAll('[data-translate]').forEach((element) => {
        const id = `@page/${element.getAttribute('data-translate')}`;
        if (id) {
            if (messages[lc]) {
                // @ts-ignore
                element.innerText = messages[lc][id]
            } else {
                // @ts-ignore
                element.innerText = messages['en-US'][id]
            }
        }
    })
}

export const i18n = async (id: string, ...arg: any[]) => {
    const lc = normalizeLanguageCode(navigator.language)

    if (messages[lc] && messages[lc][id]) {
        return format(messages[lc][id], arg)
    } else {
        return format(messages['en-US'][id], arg)
    }
}

const format = async (text: string, args: any[]) => {
    const lc = normalizeLanguageCode(navigator.language)

    let index = 0

    while (true) {
        let p = text.substring(index).indexOf('%')

        if (p === -1) {
            break
        }
        p += text.substring(0, index).length

        // %%
        if (text[p] === '%' && text[p+1] === '%') {
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

        // %localized_lang
        // argument: string
        // if localized_lang exists, use it
        if (text.substring(p+1, p+15) === 'localized_lang') {
            let arg = args.shift()
            if (messages[lc] && messages[lc][`@lang/${arg}`]) {
                text = text.slice(0, p) + messages[lc][`@lang/${arg}`] + text.slice(p+15)
            } else if (LanguageLocal[arg]) {
                text = text.slice(0, p) + LanguageLocal[arg] + text.slice(p+15)
            } else {
                text = text.slice(0, p) + arg + text.slice(p+15)
            }
        }

        // %lang
        if (text.substring(p+1, p+5) === 'lang') {
            const config = await chrome.storage.local.get(['target_lang']);

            if (messages[lc] && messages[lc][`@lang/${config.target_lang}`]) {
                text = text.slice(0, p) + LanguageLocal[lc] + text.slice(p+5)
            } else if (LanguageLocal[lc]) {
                text = text.slice(0, p) + LanguageLocal[lc] + text.slice(p+5)
            } else {
                text = text.slice(0, p) + config.target_lang + text.slice(p+5)
            }
        }

        index = p + 1
    }

    return text
}