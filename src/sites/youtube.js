const QS_TRANSLATE_BUTTON = "#header>#header-author>yt-formatted-string>#translate-button";
const QS_CONTENT_TEXT = "#expander>#content>#content-text";
const QS_BUTTON_CONTAINER = "#header>#header-author>yt-formatted-string";
const QS_DESCRIPTION_CONTAINER = "#info-container";
const QS_DESCRIPTION_EXPANDED = "#description-inline-expander > yt-attributed-string";
const TRANSLATE_TEXT = "translate";
const UNDO_TEXT = "undo";
const TARGET = navigator.language || navigator.userLanguage;

const replaceNode = (a, b) => {
    a.parentNode.appendChild(b);
    a.parentNode.removeChild(a);
};

const translateButtonSetState = function () {
    if (this._ntext.parentNode !== null) {
        replaceNode(this._ntext, this._otext);
        this.innerText = TRANSLATE_TEXT;
    } else {
        replaceNode(this._otext, this._ntext);
        this.innerText = `${UNDO_TEXT} (${this.detected_lang})`;
    }
};

const resetTranslateButton = (translateButton) => {
    if (translateButton._ntext.parentNode !== null) replaceNode(translateButton._ntext, translateButton._otext);

    translateButton._ntext.innerText = "";
    translateButton.innerText = TRANSLATE_TEXT;
    translateButton.onclick = translateButtonTranslate;
};

const translateButtonTranslate = async () => {
    this.onclick = translateButtonSetState;
    chrome.runtime.sendMessage({ "action": "detect_lang", "text": this._otext.innerText }).then(lang => {
        this.detected_lang = lang;
        chrome.runtime.sendMessage({ "action": "translate", "source": lang, "target": TARGET, "text": this._otext.innerText }).then(result => {
            this._ntext.innerText = result.translatedText;
        });
    });
};

const createTranslateButton = (comment) => {
    const translateButton = document.createElement("a");
    translateButton.style = "margin-left: 5px";
    translateButton.classList = "yt-simple-endpoint style-scope yt-formatted-string";
    translateButton.onclick = translateButtonTranslate;

    translateButton._otext = comment.querySelector(QS_CONTENT_TEXT);
    translateButton._otext.addEventListener("DOMSubtreeModified", () => resetTranslateButton(translateButton));

    translateButton._ntext = document.createElement("div");
    translateButton._ntext.style.whiteSpace = "pre-wrap";
    translateButton._ntext.id = "content-text";
    translateButton._ntext.classList = "style-scope ytd-comment-renderer translate-text yt-formatted-string";

    resetTranslateButton(translateButton);
    return translateButton;
};

const commentObserverCallback = (mutations) => {
    for (let mutation of mutations) {
        if (mutation.target.id === "contents") {
            for (let node of mutation.addedNodes) {
                let main = node.querySelector("#body>#main");
                if (!main) continue;

                let translateButton = main.querySelector(QS_TRANSLATE_BUTTON);
                if (translateButton !== null) {
                    resetTranslateButton(translateButton);
                } else {
                    main.querySelector(QS_BUTTON_CONTAINER).appendChild(createTranslateButton(main));
                }
            }
        }
    }
};

const commentObserver = new MutationObserver(commentObserverCallback);

(() => {
    const observerConfig = { childList: true, subtree: true };
    commentObserver.observe(document, observerConfig);
})()
