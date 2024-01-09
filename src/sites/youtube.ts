import '@webcomponents/custom-elements';

import {TranslateButton} from "./button";
import {normalizeLanguageCode, targetLocalized} from "../utils/utils";

import "../styles/youtube.css";
import {debug} from "../utils/log.ts";

const QS_TRANSLATE_BUTTON = "#expander > translation-button";
const QS_CONTENT_TEXT = "#expander > #content > #content-text";

customElements.define('translation-button', TranslateButton);

const createTranslateButton = async (commentText: HTMLElement) => {
    const translateButton = document.createElement('translation-button') as TranslateButton;
    translateButton.onclick = translateButton.toggle;

    const translateButtonText = document.createElement('span');
    translateButtonText.innerText = chrome.i18n.getMessage("site_comment@translate", await targetLocalized());
    translateButtonText.className = 'translate-button-text more-button style-scope ytd-comment-renderer';
    translateButton.appendChild(translateButtonText);

    translateButton.InnerTextElement = translateButtonText;
    translateButton.TextElement = commentText;

    (new MutationObserver(async (mutations) => {
        if (mutations.length === 0) return;
        await translateButton.reset();
    })).observe(commentText as HTMLElement, {childList: true, subtree: true});

    return translateButton;
};

const commentObserver = new MutationObserver(async (mutations) => {
    const config = await chrome.storage.local.get(['dont_display_same_lang', 'target_lang']);

    for (let mutation of mutations) {
        // @ts-ignore
        if (mutation.target.id === "contents") {
            comment:
            for (let node of mutation.addedNodes) {
                // @ts-ignore
                let main = node.querySelector("#body > #main");
                if (!main) continue;

                let translateButton = main.querySelector(QS_TRANSLATE_BUTTON);
                if (translateButton !== null) {
                    await translateButton.reset(main.querySelector(QS_CONTENT_TEXT) as HTMLElement);
                } else {
                    const commentText = main.querySelector(QS_CONTENT_TEXT) as HTMLElement;
                    const commentLanguage = await chrome.i18n.detectLanguage(commentText.innerText);
                    if (config.dont_display_same_lang) {
                        for (let lan of commentLanguage.languages) {
                            if (normalizeLanguageCode(lan.language) === config.target_lang) {
                                debug("youtube", `Skip translating comment in ${lan.language}, ${lan.percentage}`);
                                continue comment;
                            }
                        }
                    }

                    main.querySelector("#expander").appendChild(document.createElement('br'));
                    main.querySelector("#expander").appendChild(await createTranslateButton(commentText));
                }
            }
        }
    }
});

commentObserver.observe(document, { childList: true, subtree: true });