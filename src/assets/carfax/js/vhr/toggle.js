function toggleLanguage(lang){
    window.location = rebuildUrlWithLanguageToggle(lang);
}

function rebuildUrlWithLanguageToggle(language) {

    var currentUrl = window.location.href;

    if (language == 'es' || language == 'fr_ca') {
        // Prepend params rather than append them to avoid problems with anchor tags that sometimes appear in the URL.
        currentUrl = currentUrl.replace('?', '?language=' + language + '&');
    } else {
        currentUrl = currentUrl.replace(/language=(es|fr_ca)&/,'');
    }

    if (currentUrl.match(/track=(true|false)/)) {
        currentUrl = currentUrl.replace(/track=(true|false)&?/,'')
    }

    // Prepend params rather than append them to avoid problems with anchor tags that sometimes appear in the URL.
    currentUrl = currentUrl.replace('?','?track=false&');

    return currentUrl;
}