// ==UserScript==
// @name         teoria.pl helper for Russian speaking persons
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Translate teoria.pl questions, answers and explanations to Russian
// @author       Pavel Geveiler
// @match        https://www.teoria.pl/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==
(function () {
    'use strict';

    var divIds = ['question-content', 'report-question-content', 'a-answer', 'b-answer', 'c-answer', 'report-explanation', 'report-a-answer', 'report-b-answer', 'report-c-answer'];
    var contentCache = {};

    function translateText(text, callback) {
        GM_xmlhttpRequest({
            method: "POST",
            url: "https://dobroedelo39.ru/other/teoria_pl_tests_translate/",
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify({ text: text }),

            onload: function (response) {
                var result = JSON.parse(response.responseText);
                console.log("")
                console.log("Original: " + text)
                console.log("Translate: " + result.translate)
                console.log("")
                callback(result.translate);
            }
        });
    }

    function updateTranslation(id) {
        var element = document.getElementById(id);

        if (element) {
            var originalTextWithNoTranslate = element.innerHTML.replace(/<translation>.*?<\/translation>/g, '').replace(/<\/?[^>]+(>|$)/g, '').trim();

            if (originalTextWithNoTranslate !== '' && originalTextWithNoTranslate !== contentCache[id]) {
                console.log("Element changed: " + originalTextWithNoTranslate)
                contentCache[id] = originalTextWithNoTranslate;

                if (id.endsWith('-answer')) {
                    translateText(originalTextWithNoTranslate, function (translatedText) {
                        element.innerHTML = originalTextWithNoTranslate + '<translation><br /><b>' + translatedText + '</b><br /><br /></translation>';
                    });
                } else {
                  translateText(originalTextWithNoTranslate, function (translatedText) {
                      var clonedId = id + '-cloned';
                      var clonedContent = document.getElementById(clonedId);

                      if (!clonedContent) {
                          clonedContent = document.createElement('div');
                          clonedContent.id = clonedId;
                          element.parentNode.insertBefore(clonedContent, element.nextSibling);

                          if (id.endsWith('-content')) {
                              element.parentNode.insertBefore(document.createElement('br'), clonedContent);
                          }

                          element.parentNode.insertBefore(document.createElement('br'), clonedContent.nextSibling);
                      }

                      clonedContent.innerHTML = '<b>' + translatedText + '</b>';
                  });
                }
            }
        }
    }

    setInterval(function () {
        divIds.forEach(updateTranslation);
    }, 100);
})();
