import '@webcomponents/custom-elements';

import {TranslateButton} from "./button";
import {targetLocalized} from "../utils/utils";

import "../styles/youtube.css";

const QS_TRANSLATE_BUTTON = "#expander > translation-button";
const QS_CONTENT_TEXT = "#expander > #content > #content-text";

customElements.define('translation-button', TranslateButton);

const createTranslateButton = async (main: HTMLElement) => {
    const translateButton = document.createElement('translation-button') as TranslateButton;
    translateButton.onclick = translateButton.toggle;

    const translateButtonText = document.createElement('span');
    translateButtonText.innerText = chrome.i18n.getMessage("site_comment@translate", await targetLocalized());
    translateButtonText.className = 'translate-button-text more-button style-scope ytd-comment-renderer';
    translateButton.appendChild(translateButtonText);

    translateButton.InnerTextElement = translateButtonText;
    translateButton.TextElement = main.querySelector(QS_CONTENT_TEXT) as HTMLElement;

    (new MutationObserver(async (mutations) => {
        if (mutations.length === 0) return;
        await translateButton.reset();
    })).observe(main.querySelector(QS_CONTENT_TEXT) as HTMLElement, {childList: true, subtree: true});

    return translateButton;
};

const commentObserver = new MutationObserver(async (mutations) => {
    for (let mutation of mutations) {
        // @ts-ignore
        if (mutation.target.id === "contents") {
            for (let node of mutation.addedNodes) {
                // @ts-ignore
                let main = node.querySelector("#body > #main");
                if (!main) continue;

                let translateButton = main.querySelector(QS_TRANSLATE_BUTTON);
                if (translateButton !== null) {
                    await translateButton.reset(main.querySelector(QS_CONTENT_TEXT) as HTMLElement);
                } else {
                    main.querySelector("#expander").appendChild(document.createElement('br'));
                    main.querySelector("#expander").appendChild(await createTranslateButton(main));
                }
            }
        }
    }
});

commentObserver.observe(document, { childList: true, subtree: true });