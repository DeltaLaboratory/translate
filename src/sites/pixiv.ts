import '@webcomponents/custom-elements';

import {TranslateButton} from "./button";
import {targetLocalized} from "../utils/utils";

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

            for (let comment of comments) {
                let commentFooter = comment.querySelector(".sjnZECjgm30vzm3b")
                if (commentFooter!.querySelector("translation-button")) {
                    await commentFooter!.querySelector("translation-button")!.reset()
                } else {
                    let commentText = comment.querySelector(".sc-15qj8u5-0")
                    if (commentText.innerText === "") {
                        continue
                    }
                    commentFooter!.appendChild(await createTranslateButton(commentText))
                }
            }
        }
    }
})

commentObserver.observe(document, { childList: true, subtree: true })
