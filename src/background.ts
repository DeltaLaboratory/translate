import hmacMD5 from 'crypto-js/hmac-md5'
import hmacSHA1 from 'crypto-js/hmac-sha1'
import Base64 from 'crypto-js/enc-base64';

import { v4 } from 'uuid'

const papagoVersion = 'v1.7.9_ee61e6111a'
const deviceID = v4()

const padAppHash = async (url: string) => {
    const timeStampMilli = Date.now()
    const pad = Base64.stringify(hmacSHA1(`${url}${timeStampMilli}`, 'aVwDprJBYvnz1NBs8W7GBuaHQDeoynolGF5IdsxyYP6lyCzxAOG38hleJo43NnB6'))
    return `${url}?msgpad=${timeStampMilli}&md=${pad}`
}

const detectLang = async (text: string) => {
    let time = Date.now()
    let hash = Base64.stringify(hmacMD5(`${deviceID}\nhttps://papago.naver.com/apis/langs/dect\n${time}`, papagoVersion))
    const res = await fetch(`https://papago.naver.com/apis/langs/dect`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `PPG ${deviceID}:${hash}`,
            'device-type': 'pc',
            'deviceId': deviceID,
            'timestamp': `${time}`
        },
        body: `query=${encodeURIComponent(text)}`
    })
    const json = await res.json()
    return json.langCode
}

const translate = async (text: string, source: string, target: string) => {
    let time = Date.now()
    let hash = Base64.stringify(hmacMD5(`${deviceID}\nhttps://papago.naver.com/apis/n2mt/translate\n${time}`, papagoVersion))

    const config = await chrome.storage.sync.get(['honorific'])
    console.log(config)

    const res = await fetch(`https://papago.naver.com/apis/n2mt/translate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `PPG ${deviceID}:${hash}`,
            'device-type': 'pc',
            'deviceId': deviceID,
            'timestamp': `${time}`
        },
        body: `deviceId=${deviceID}&locale=${source}&agree=false&dict=false&dictDisplay=30&honorific=${config.honorific}&instant=true&paging=false&source=${source}&target=${target}&text=${text}`
    })
    return await res.json()
}

const translateImage = async (blob: Blob, source: string, target: string) => {
    const formData = new FormData()
    formData.append('image', blob, 'image')
    formData.append('source', source)
    formData.append('target', target)

    let res = await fetch(await padAppHash('https://apis.naver.com/papago/papago_app/ocr/detect'), {
        method: 'POST',
        body: formData
    })

    const json = await res.json()
    if (res.status >= 400) {
        throw new Error(`Failed to translate image: ${json.errorCode}/${json.errorMessage}`)
    }
    return `data:image/png;base64,${json.renderedImage}`
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'detect_lang') {
        detectLang(request.text).then(lang => {
            sendResponse(lang)
        })
        return true
    }
    if (request.action === 'translate') {
        translate(request.text, request.source, request.target).then(json => {
            sendResponse(json)
        })
        return true
    }
    return false
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'translate_image') {
        let config = await chrome.storage.sync.get(['image_source_lang'])
        try {
            let imageURL = new URL(info.srcUrl!)
            let url = new URL(tab!.url!)
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: [3],
                addRules: [{
                    id: 3,
                    action: {
                        type: 'modifyHeaders',
                        requestHeaders: [{
                            header: 'Origin',
                            operation: 'set',
                            value: url.origin,
                        }, {
                            header: 'Referer',
                            operation: 'set',
                            value: url.toString(),
                        }],
                    },
                    condition: {
                        domains: [chrome.runtime.id],
                        urlFilter: imageURL.origin + '/*',
                    },
                }] as chrome.declarativeNetRequest.Rule[],
            });

            console.log(chrome.declarativeNetRequest.getDynamicRules())
            let res = await fetch(imageURL.toString())
            let blob = await res.blob()
            let image = await translateImage(blob, config.image_source_lang, 'ko')
            await chrome.tabs.sendMessage(tab!.id!, {
                action: 'alter_image_url',
                url: info.srcUrl,
                translated_url: image
            })
        } catch (e) {
            await chrome.tabs.sendMessage(tab!.id!, {
                action: 'error_alert',
                message: `Failed to translate image: ${e}`
            })
        }
    }
})

chrome.runtime.onInstalled.addListener(async () => {
    chrome.storage.sync.get(['honorific', 'image_source_lang']).then((config) => {
        if (config.honorific === undefined) {
            chrome.storage.sync.set({honorific: true});
        }

        if (config.image_source_lang === undefined) {
            chrome.storage.sync.set({image_source: 'en'});
        }
    })

    const rules = [{
        id: 1,
        action: {
            type: 'modifyHeaders',
            requestHeaders: [{
                header: 'Referer',
                operation: 'set',
                value: 'https://papago.naver.com',
            }, {
                header: 'Origin',
                operation: 'set',
                value: 'https://papago.naver.com/',
            }],
        },
        condition: {
            domains: [chrome.runtime.id],
            urlFilter: '*://papago.naver.com/apis/*',
            resourceTypes: ['xmlhttprequest'],
        },
    }, {
        id: 2,
        action: {
            type: 'modifyHeaders',
            requestHeaders: [{
                header: 'Access-Control-Allow-Origin',
                operation: 'set',
                value: '*',
            }],
        },
        condition: {
            domains: [chrome.runtime.id],
            urlFilter: '|https*',
            resourceTypes: ['xmlhttprequest'],
        },
    }];
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: rules.map(r => r.id),
        addRules: rules as chrome.declarativeNetRequest.Rule[],
    });

    // install context menu
    chrome.contextMenus.create({
        id: 'translate',
        title: 'Translate',
        contexts: ['selection']
    });

    chrome.contextMenus.create({
        id: 'translate_image',
        title: 'Translate Image',
        contexts: ['image']
    });
});