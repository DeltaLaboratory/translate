import '@webcomponents/custom-elements';

import {i18n} from "../i18n/i18n";

import "../styles/youtube.css";

const QS_TRANSLATE_BUTTON = "#expander > translation-button";
const QS_CONTENT_TEXT = "#expander > #content > #content-text";

class Translation extends HTMLElement {
    translated: boolean;
    originalText: string;
    translatedText: string;

    TextElement: HTMLElement | undefined;
    InnerTextElement: HTMLSpanElement | undefined;

    constructor() {
        super();
        this.translated = false;
        this.originalText = "";
        this.translatedText = "";

        this.onclick = this.toggle;
    }

    reset() {
        this.translated = false;
        this.originalText = "";
        this.translatedText = "";
    }

    async toggle() {
        if (!this.TextElement || !this.InnerTextElement) {
            console.error("translate extension: TextElement or InnerTextElement is undefined");
            return;
        }

        switch (this.translated) {
            case true:
                this.InnerTextElement.innerText = await i18n("@youtube/translate");
                this.TextElement.innerText = this.originalText;
                this.translated = false;
                break;
            case false:
                if (this.translatedText) {
                    this.InnerTextElement.innerText = await i18n("@youtube/show-original-comment");
                    this.TextElement.innerText = this.translatedText;
                    this.translated = true;
                    return;
                }

                this.originalText = this.TextElement.innerText;
                this.InnerTextElement.innerText = await i18n("@youtube/translating");

                const config = await chrome.storage.local.get(['target_lang']);
                let translated = await chrome.runtime.sendMessage({
                    action: 'translate',
                    text: this.originalText,
                    source: 'auto',
                    target: config.target_lang
                })

                this.translatedText = translated.translatedText;
                this.TextElement.innerText = this.translatedText;
                this.InnerTextElement.innerText = await i18n("@youtube/show-original-comment");
                break;
        }
    }
}
customElements.define('translation-button', Translation);

const createTranslateButton = async (main: HTMLElement) => {
    const translateButton = document.createElement('translation-button') as Translation;
    translateButton.onclick = translateButton.toggle;

    const translateButtonText = document.createElement('span');
    translateButtonText.innerText = await i18n("@youtube/translate");
    translateButtonText.className = 'translate-button-text more-button style-scope ytd-comment-renderer';
    translateButton.appendChild(translateButtonText);

    translateButton.InnerTextElement = translateButtonText;
    translateButton.TextElement = main.querySelector(QS_CONTENT_TEXT) as HTMLElement;
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
                    console.log(translateButton)
                    translateButton.reset();
                } else {
                    main.querySelector("#expander").appendChild(document.createElement('br'));
                    main.querySelector("#expander").appendChild(await createTranslateButton(main));
                }
            }
        }
    }
});

commentObserver.observe(document, { childList: true, subtree: true });