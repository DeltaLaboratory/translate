import '@webcomponents/custom-elements';

import {TranslateButton} from "./button";
import {normalizeLanguageCode, targetLocalized} from "../utils/utils";
import {debug} from "../utils/log";

customElements.define('translation-button', TranslateButton);

const createTranslateButton = async (commentText: HTMLDivElement) => {
    const translateButton = document.createElement('translation-button') as TranslateButton;
    translateButton.onclick = translateButton.toggle;

    const translateButtonText = document.createElement('span');
    translateButtonText.innerText = chrome.i18n.getMessage("site_comment@translate", await targetLocalized());
    translateButtonText.className = 'sc-15qj8u5-3 fqQOcp';
    translateButtonText.style.marginLeft = "5px"

    translateButton.appendChild(translateButtonText);
    translateButton.InnerTextElement = translateButtonText;
    translateButton.TextElement = commentText;
    return translateButton;
}

const commentObserver = new MutationObserver(async (mutations) => {
    for (let mutation of mutations) {
        for (let node of mutation.addedNodes) {
            // @ts-ignore
            if (!node.querySelectorAll) { return; }
            // @ts-ignore
            let comments = node.querySelectorAll(".GBxGnK4pGIQ2sxMc")
            if (!comments) { return }

            const settings = await chrome.storage.local.get(['dont_display_same_lang', 'target_lang'])

            comment:
            for (let comment of comments) {
                const commentFooter = comment.querySelector(".sjnZECjgm30vzm3b")
                if (commentFooter!.querySelector("translation-button")) {
                    await commentFooter!.querySelector("translation-button")!.reset()
                } else {
                    const commentText = comment.querySelector(".sc-15qj8u5-0")
                    if (commentText.innerText === "") {
                        continue
                    }
                    if (settings.dont_display_same_lang) {
                        const lang = await chrome.i18n.detectLanguage(commentText.innerText)
                        for (let lan of lang.languages) {
                            if (normalizeLanguageCode(lan.language) === settings.target_lang) {
                                debug("pixiv", `Skip translating comment in ${lan.language}, ${lan.percentage}`)
                                continue comment
                            }
                        }
                    }
                    commentFooter!.appendChild(await createTranslateButton(commentText))
                }
            }
        }
    }
})

commentObserver.observe(document, { childList: true, subtree: true })
