// ==UserScript==
// @name         teoria.pl helper for Russian speaking persons
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Translate teoria.pl questions, answers and explanations to Russian
// @author       Pavel Geveiler
// @match        https://www.teoria.pl/*
// @grant        GM_xmlhttpRequest
// @require      https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.js
// ==/UserScript==
(function () {
    'use strict';

    var selectors = [
        '#question-content',
        '#report-question-content',
        '#a-answer',
        '#b-answer',
        '#c-answer',
        '#report-explanation',
        '#report-a-answer',
        '#report-b-answer',
        '#report-c-answer',
        '#a0',
        '#a1',
        '#a2',
        'div.col-md-6.col-lg-6 > div:not([class]):not([id])'
    ];

    var contentCache = {};

    function getCacheKey(originalText) {
        return "translationCache_" + CryptoJS.MD5(originalText).toString();
    }

    function printNumberOfTranslationsInCache() {
        console.log("Number of translations in cache: " + Object.keys(localStorage).filter(key => key.startsWith("translationCache_")).length);
    }


    function saveToCache(original, translate) {
        localStorage.setItem(getCacheKey(original), translate);
        console.log("Translation saved to cache: " + translate);
        printNumberOfTranslationsInCache();
    }

    function loadFromCache(original) {
        var cachedValue = localStorage.getItem(getCacheKey(original));
        if (cachedValue !== null) {
            console.log("Translation loaded from cache: " + cachedValue);
            printNumberOfTranslationsInCache();

            return cachedValue;
        }

        return null;
    }

    function translateText(text, callback) {
        var cachedTranslation = loadFromCache(text);

        if (cachedTranslation !== null) {
            callback(cachedTranslation);
        } else {
            GM_xmlhttpRequest({
                method: "POST",
                url: "https://dobroedelo39.ru/other/teoria_pl_tests_translate/",
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify({ text: text }),
                onload: function (response) {
                    var result = JSON.parse(response.responseText);

                    console.log("");
                    console.log("Original: " + text);
                    console.log("Translate: " + result.translate);
                    console.log("");

                    if (result.translate && result.translate.trim() !== '') {
                        saveToCache(text, result.translate);
                        callback(result.translate);
                    } else {
                        console.log("Invalid translation received for: " + text);
                        callback("Ошибка: не получилось перевести.");
                    }
                }
            });
        }
    }

    function getElementWithTranslation(originalElement) {
        var clonedId = originalElement.id + '-cloned';
        var clonedContent = document.getElementById(clonedId);

        if (!clonedContent) {
            clonedContent = document.createElement('div');
            clonedContent.id = clonedId;
            originalElement.parentNode.insertBefore(clonedContent, originalElement.nextSibling);

            if (originalElement.id.endsWith('-content')) {
                originalElement.parentNode.insertBefore(document.createElement('br'), clonedContent);
            }

            originalElement.parentNode.insertBefore(document.createElement('br'), clonedContent.nextSibling);
        }

        return clonedContent
    }

    function updateTranslation(selector) {
        document.querySelectorAll(selector).forEach(element => {
            var id = element.id; // Определение ID элемента
            var originalTextWithNoTranslate = element.innerHTML.replace(/<translation>.*?<\/translation>/g, '').replace(/<\/?[^>]+(>|$)/g, '').trim();

            if (originalTextWithNoTranslate !== '' && originalTextWithNoTranslate !== contentCache[selector]) {
                console.log("Element changed: " + originalTextWithNoTranslate)
                contentCache[selector] = originalTextWithNoTranslate;

                if (id && id.endsWith('-answer')) {
                    translateText(originalTextWithNoTranslate, function (translatedText) {
                        element.innerHTML = originalTextWithNoTranslate + '<translation><br /><b>' + translatedText + '</b><br /><br /></translation>';
                    });
                } else {
                    var clonedContent = getElementWithTranslation(element)
                    clonedContent.style.display = 'none';

                    translateText(originalTextWithNoTranslate, function (translatedText) {
                        var clonedContent = getElementWithTranslation(element)
                        clonedContent.innerHTML = '<b>' + translatedText + '</b>';
                        clonedContent.style.display = 'block';
                    });
                }
            }
        });
    }

    setInterval(function () {
        selectors.forEach(updateTranslation);
    }, 100);
})();
