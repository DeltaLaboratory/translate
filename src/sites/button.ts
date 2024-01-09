import '@webcomponents/custom-elements';

import {targetLocalized} from "../utils/utils.ts";
import {debug, warn} from "../utils/log.ts";

export class TranslateButton extends HTMLElement {
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

    async reset() {
        debug("translate-button", "reset translate button")
        if (this.translated && this.InnerTextElement && this.TextElement) {
            this.InnerTextElement.innerText = chrome.i18n.getMessage("site_comment@translate", await targetLocalized());
            this.TextElement.innerText = this.originalText;
        }

        this.translated = false;
        this.originalText = "";
        this.translatedText = "";
    }

    async toggle() {
        if (!this.TextElement || !this.InnerTextElement) {
            warn("translate-button", "TextElement or InnerTextElement is undefined");
            return;
        }

        switch (this.translated) {
            case true:
                this.InnerTextElement.innerText = chrome.i18n.getMessage("site_comment@translate", await targetLocalized());
                this.TextElement.innerText = this.originalText;
                this.translated = false;
                break;
            case false:
                if (this.translatedText) {
                    this.InnerTextElement.innerText = chrome.i18n.getMessage("site_comment@show_original");
                    this.TextElement.innerText = this.translatedText;
                    this.translated = true;
                    return;
                }

                this.originalText = this.TextElement.innerText;
                this.InnerTextElement.innerText = chrome.i18n.getMessage("site_comment@translating");

                const config = await chrome.storage.local.get(['target_lang']);
                let translated = await chrome.runtime.sendMessage({
                    action: 'translate',
                    text: this.originalText,
                    source: 'auto',
                    target: config.target_lang
                })

                this.translatedText = translated.translatedText;
                this.TextElement.innerText = this.translatedText;
                this.InnerTextElement.innerText = chrome.i18n.getMessage("site_comment@show_original");
                break;
        }
    }
}
