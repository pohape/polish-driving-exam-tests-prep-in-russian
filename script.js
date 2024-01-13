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
(function() {
    'use strict';

    var selectors = [
        '#question-content',
        '#report-question-content',
        '#a-answer',
        '#b-answer',
        '#c-answer',
        '#report-explanation',
        '#q-result-explanation',
        '#q-result-question',
        '#learning-success-tr2 > td > div:not([class]):not([id])',
        '#learning-failure-tr2 > td:first-child',
        '#learning-failure-tr3 > td:first-child',
        '#report-a-answer',
        '#report-b-answer',
        '#report-c-answer',
        '#a0',
        '#a1',
        '#a2',
        'div.col-md-6.col-lg-6 > div:not([class]):not([id])',
        'div.page_title > h1'
    ];

    var selectorsToRemove = [
        {
            selector: '.right-a.right-a-nl',
            deleteLevel: 0
        },
        {
            selector: '.google-auto-placed',
            deleteLevel: 0
        },
        {
            selector: 'iframe',
            deleteLevel: 0
        },
        {
            selector: 'div > .adsbygoogle',
            deleteLevel: 1
        },
        {
            selector: '.adsbygoogle',
            deleteLevel: 0
        },
        {
            selector: '.cc_banner-wrapper',
            deleteLevel: 0
        },
        {
            selector: '.google-revocation-link-placeholder',
            deleteLevel: 0
        },
        {
            selector: 'div.col-xs-12.society-like',
            deleteLevel: 2
        },
        {
            selector: '.top_header_area.hidden-xs',
            deleteLevel: 0
        },
        {
            selector: 'ol.test-list',
            deleteLevel: 3
        },
        {
            selector: 'div.text-center.version',
            deleteLevel: 3
        }
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
                url: "http://193.177.165.241/teoria_pl_tests_translate/",
                headers: {
                    "Content-Type": "application/json"
                },
                data: JSON.stringify({
                    text: text
                }),
                onload: function(response) {
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
         if (!originalElement.id) {
              originalElement.id = 'random-' + Math.floor(Math.random() * 1000000);
          }

        var originalId = originalElement.id;
        var clonedId = originalId + '-cloned';
        var clonedContent = document.getElementById(clonedId);

        if (!clonedContent) {
            clonedContent = document.createElement(originalElement.tagName);
            clonedContent.id = clonedId;
            originalElement.parentNode.insertBefore(clonedContent, originalElement.nextSibling);

            if (originalId.endsWith('-content') || originalId.endsWith('q-result-explanation') || originalId.endsWith('q-result-question')) {
                originalElement.parentNode.insertBefore(document.createElement('br'), clonedContent);
            }

            originalElement.parentNode.insertBefore(document.createElement('br'), clonedContent.nextSibling);
        }

        return clonedContent
    }

    function updateTranslation(selector) {
        document.querySelectorAll(selector).forEach(element => {
            var id = element.id;

            if (!id.includes('-cloned')) {
                var originalTextWithNoTranslate = element.innerHTML.replace(/<translation>.*?<\/translation>/g, '').replace(/<\/?[^>]+(>|$)/g, '').trim();

                if (originalTextWithNoTranslate !== '' && originalTextWithNoTranslate !== contentCache[selector]) {
                    console.log("Element changed: " + originalTextWithNoTranslate)
                    contentCache[selector] = originalTextWithNoTranslate;

                    if (id && id.endsWith('-answer')) {
                        translateText(originalTextWithNoTranslate, function(translatedText) {
                            element.innerHTML = originalTextWithNoTranslate + '<translation><br /><b>' + translatedText + '</b><br /><br /></translation>';
                        });
                    } else if (selector.includes('page_title')) {
                        translateText(originalTextWithNoTranslate, function(translatedText) {
                            element.innerHTML = originalTextWithNoTranslate + '<translation><br />' + translatedText + '</translation>';
                        });
                    } else {
                        var clonedContent = getElementWithTranslation(element)
                        clonedContent.style.display = 'none';

                        translateText(originalTextWithNoTranslate, function(translatedText) {
                            var clonedContent = getElementWithTranslation(element)
                            clonedContent.innerHTML = '<b>' + translatedText + '</b>';
                            clonedContent.style.display = 'block';
                        });
                    }
                }
            }
        });
    }

    var emptyRemoved = false;

    setInterval(function() {
        selectors.forEach(updateTranslation);

        const consentButton = document.querySelector('button.fc-button.fc-cta-consent.fc-primary-button');

        if (consentButton && !consentButton.classList.contains('clicked')) {
            consentButton.classList.add('clicked');
            consentButton.click();
        }

        var videoElement = document.getElementById('video');

        if (videoElement) {
            videoElement.controls = true;
        }

        var imgElement = document.querySelector('img.img-responsive');

        imgElement.addEventListener('click', function() {
            // Проверяем, поддерживает ли браузер API полноэкранного режима
            if (imgElement.requestFullscreen) {
                imgElement.requestFullscreen(); // Нативный полноэкранный режим
            } else if (imgElement.mozRequestFullScreen) { /* Firefox */
                imgElement.mozRequestFullScreen();
            } else if (imgElement.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
                imgElement.webkitRequestFullscreen();
            } else if (imgElement.msRequestFullscreen) { /* IE/Edge */
                imgElement.msRequestFullscreen();
            }
        });

        selectorsToRemove.forEach(function(item) {
            var elements = document.querySelectorAll(item.selector);

            elements.forEach(function(element) {
                var elementToRemove = element;

                for (var i = 0; i < item.deleteLevel; i++) {
                    if (elementToRemove.parentNode) {
                        elementToRemove = elementToRemove.parentNode;
                    } else {
                        break;
                    }
                }

                elementToRemove.parentNode.removeChild(elementToRemove);
            });
        });

        if (!emptyRemoved) {
            var elementToRemove = document.querySelector('section.breadcumb_area + *');

            if (elementToRemove) {
                elementToRemove.parentNode.removeChild(elementToRemove);
                emptyRemoved = true;
            }
        }
    }, 100);

    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
    .breadcumb_area {
        height: 170px !important;
    }
    .breadcumb_section {
        margin-top: 33px !important;
    }`;
    document.head.appendChild(style);
})();
