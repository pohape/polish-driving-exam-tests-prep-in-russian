// ==UserScript==
// @name         teoria.pl helper for Russian speaking persons
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Translate teoria.pl questions, answers and explanations to Russian
// @author       Pavel Geveiler
// @match        https://www.teoria.pl/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==
(function() {
    'use strict';

    // Вставьте свой API-ключ здесь, можете запросить его у t.me/pohape
    var yandexApiKey = '';

    var divIds = ['question-content', 'report-question-content', 'a-answer', 'b-answer', 'c-answer', 'report-explanation', 'report-a-answer', 'report-b-answer', 'report-c-answer'];
    var contentCache = {};

    function translateText(text, callback) {
        if (yandexApiKey === '') {
            callback("Впишите API-ключ в верхней части скрипта");

            return;
        }

        GM_xmlhttpRequest({
            method: "POST",
            url: "https://translate.api.cloud.yandex.net/translate/v2/translate",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Api-Key " + yandexApiKey
            },
            data: JSON.stringify({
                texts: [text],
                sourceLanguageCode: "pl",
                targetLanguageCode: "ru"
            }),
            onload: function(response) {
                var result = JSON.parse(response.responseText);
                callback(result.translations[0].text);
            }
        });
    }

    function updateTranslation(id) {
        var element = document.getElementById(id);

        if (element && element.textContent.trim() !== '' && element.textContent !== contentCache[id]) {
            contentCache[id] = element.textContent;

            translateText(element.textContent, function(translatedText) {
                var clonedId = id + '-cloned';
                var clonedContent = document.getElementById(clonedId);

                if (!clonedContent) {
                    clonedContent = document.createElement('div');
                    clonedContent.id = clonedId;
                    element.parentNode.insertBefore(clonedContent, element.nextSibling);

                    if (id.endsWith('-content')) {
                        element.parentNode.insertBefore(document.createElement('br'), clonedContent);
                    } else if (id.endsWith('-answer')) {
                        element.parentNode.insertBefore(document.createElement('br'), clonedContent.nextSibling);
                    }

                    element.parentNode.insertBefore(document.createElement('br'), clonedContent.nextSibling);
                }

                if (id.endsWith('-answer')) {
                    clonedContent.innerHTML = '<b style="margin-left: 50px">' + translatedText + '</b>';
                } else {
                    clonedContent.innerHTML = '<b>' + translatedText + '</b>';
                }

            });
        }
    }

    setInterval(function() {
        divIds.forEach(updateTranslation);
    }, 100);
})();
