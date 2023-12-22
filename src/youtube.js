const QS_TRANSLATE_BUTTON = "#header>#header-author>yt-formatted-string>#translate-button";
const QS_CONTENT_TEXT = "#expander>#content>#content-text";
const QS_BUTTON_CONTAINER = "#header>#header-author>yt-formatted-string";

const QS_DESCRIPTION_CONTAINER = "#info-container";
const QS_DESCRIPTION_EXPANDED = "#description-inline-expander > yt-attributed-string";


const TRANSLATE_TEXT = "translate", UNDO_TEXT = "undo", TARGET = navigator.language || navigator.userLanguage;

function ReplaceNode(a, b) {
    a.parentNode.appendChild(b);
    a.parentNode.removeChild(a);
}

function TranslateButton_Translate() {
    this.onclick = TranslateButton_SetState;
    chrome.runtime.sendMessage({"action": "detect_lang", "text": this._otext.innerText}).then(lang => {
        this.detected_lang = lang;
        chrome.runtime.sendMessage({"action": "translate", "source": lang, "target": TARGET, "text": this._otext.innerText}).then(result => {
            this._ntext.innerText = result.translatedText;
        })
    })
}


function TranslateButton_SetState() {
    if (this._ntext.parentNode !== null) {
        ReplaceNode(this._ntext, this._otext);
        this.innerText = TRANSLATE_TEXT;
    } else {
        ReplaceNode(this._otext, this._ntext);
        this.innerText = `${UNDO_TEXT} (${this.detected_lang})`;
    }
}

const ResetTranslateButton = (translate_button) => {
    if (translate_button._ntext.parentNode !== null) ReplaceNode(translate_button._ntext, translate_button._otext);

    translate_button._ntext.innerText = "";
    translate_button.innerText = TRANSLATE_TEXT;
    translate_button.onclick = TranslateButton_Translate;
}

const TranslateButton = (comment)  => {
    const translate_button = document.createElement("a");
    translate_button.id = "translate-button";
    translate_button.style = "margin-left: 5px";
    translate_button.classList = "yt-simple-endpoint style-scope yt-formatted-string";

    translate_button._otext = comment.querySelector(QS_CONTENT_TEXT);
    translate_button._otext.addEventListener("DOMSubtreeModified", _ => ResetTranslateButton(translate_button));

    translate_button._ntext = document.createElement("div");
    translate_button._ntext.style.whiteSpace = "pre-wrap";
    translate_button._ntext.id = "content-text";
    translate_button._ntext.classList = "style-scope ytd-comment-renderer translate-text yt-formatted-string";

    ResetTranslateButton(translate_button);
    return translate_button;
}

const CommentObserver = new MutationObserver(e => {
    for (let mut of e) {
        if (mut.target.id === "contents") {
            for (let n of mut.addedNodes) {
                let main = n.querySelector("#body>#main");
                if (!main) continue;

                let tb = main.querySelector(QS_TRANSLATE_BUTTON);
                if (tb != null) {
                    ResetTranslateButton(tb);
                } else {
                    main.querySelector(QS_BUTTON_CONTAINER).appendChild(TranslateButton(main));
                }
            }
        }
    }
});

const init = () => {
    const observerConfig = {childList: true, subtree: true};
    CommentObserver.observe(document, observerConfig);
}

init();