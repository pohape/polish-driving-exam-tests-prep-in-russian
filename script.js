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
        'div.panel-body.card-panel > div.card-body'
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

    function createPopup(src, mouseX, mouseY) {
        const popup = document.createElement('div');
        popup.style.position = 'fixed';
        popup.style.top = mouseY + 'px';
        popup.style.left = mouseX + 'px';
        popup.style.zIndex = '1000';
        popup.style.border = '1px solid black';
        popup.style.backgroundColor = 'white';
        popup.style.padding = '5px';
        popup.style.boxShadow = '0px 0px 10px rgba(0,0,0,0.5)';

        const img = document.createElement('img');
        img.src = src;
        img.style.width = '200px';
        img.style.height = 'auto';

        popup.appendChild(img);
        document.body.appendChild(popup);

        return popup;
    }

    function markTranslationAsIncorrect(text) {
        GM_xmlhttpRequest({
            method: "POST",
            url: "http://193.177.165.241/teoria_pl_tests_translate/",
            headers: {
                "Content-Type": "application/json"
            },
            data: JSON.stringify({
                mark_incorrect: text
            }),
            onload: function(response) {
              var result = JSON.parse(response.responseText);

              console.log(result);
            }
        });
    }

    function approveTranslation(text) {
        GM_xmlhttpRequest({
            method: "POST",
            url: "http://193.177.165.241/teoria_pl_tests_translate/",
            headers: {
                "Content-Type": "application/json"
            },
            data: JSON.stringify({
                approve: text
            }),
            onload: function(response) {
              var result = JSON.parse(response.responseText);

              console.log(result);
            }
        });
    }

    function addLinksToSignCodes(element, translation, showEmojis) {
        const regex = /\b([A-Z]-\d+[a-z]?)\b/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(translation)) !== null) {
            // Добавляем текст до найденного соответствия жирным шрифтом
            const beforeMatch = document.createElement('b');
            beforeMatch.textContent = translation.substring(lastIndex, match.index);
            element.appendChild(beforeMatch);

            // Создаем и добавляем ссылку
            const link = document.createElement('a');
            link.href = 'https://raw.githubusercontent.com/pohape/teoria_pl_tests_translate/main/server_side/znaki/' + match[1].toUpperCase() + '.png';
            link.textContent = match[1];

            let popup;
            link.onmouseover = (e) => {
                const mouseX = e.clientX + 10; // 10 пикселей справа от курсора
                const mouseY = e.clientY + 10; // 10 пикселей ниже курсора
                popup = createPopup(link.href, mouseX, mouseY);
            };
            link.onmouseout = () => { if (popup) document.body.removeChild(popup); };
            element.appendChild(link); // Ссылка добавляется напрямую, без оборачивания в <b>

            lastIndex = regex.lastIndex;
        }

        // Добавляем оставшуюся часть текста после последнего соответствия жирным шрифтом
        if (lastIndex < translation.length) {
            const remainingText = document.createElement('b');
            remainingText.textContent = translation.substring(lastIndex);
            element.appendChild(remainingText);
        }

        if (showEmojis) {
          // Группируем смайлики в родительский элемент
          const emojiGroup = document.createElement('span'); // Создаем родительский элемент для пары смайликов

          const thumbsUpLink = document.createElement('a');
          thumbsUpLink.href = '#';
          thumbsUpLink.innerHTML = '👍'; // Смайлик палец вверх
          thumbsUpLink.onclick = (e) => {
              e.preventDefault(); // Предотвращаем переход по ссылке
              approveTranslation(translation); // Вызов функции для позитивной оценки
              emojiGroup.style.display = 'none'; // Скрываем всю группу смайликов
              saveToCacheEmojiFlag(translation, false);
          };

          const thumbsDownLink = document.createElement('a');
          thumbsDownLink.href = '#';
          thumbsDownLink.innerHTML = '👎'; // Смайлик палец вниз
          thumbsDownLink.onclick = (e) => {
              e.preventDefault(); // Предотвращаем переход по ссылке
              markTranslationAsIncorrect(translation); // Вызов функции для негативной оценки
              emojiGroup.style.display = 'none'; // Скрываем всю группу смайликов
              saveToCacheEmojiFlag(translation, false);
          };

          // Добавляем смайлики к родительскому элементу
          emojiGroup.appendChild(thumbsUpLink);
          emojiGroup.appendChild(document.createTextNode(' ')); // Добавляем пробел между смайликами
          emojiGroup.appendChild(thumbsDownLink);

          // Добавляем родительский элемент с смайликами к основному элементу на странице
          element.appendChild(emojiGroup);
        }
    }

    function getCacheKey(originalText) {
        return "translationCache_" + CryptoJS.MD5(originalText).toString();
    }

    function getCacheKeyForEmojiFlags(translation) {
        return "emojiFlagsCache_" + CryptoJS.MD5(translation).toString();
    }

    function printNumberOfTranslationsInCache() {
        console.log("Number of translations in cache: " + Object.keys(localStorage).filter(key => key.startsWith("translationCache_")).length);
    }

    function saveToCacheEmojiFlag(translate, flag) {
        localStorage.setItem(getCacheKeyForEmojiFlags(translate), flag);
    }

    function loadFromCacheEmojiFlag(original) {
        return localStorage.getItem(getCacheKeyForEmojiFlags(original));
    }

    function saveToCache(original, translate) {
        localStorage.setItem(getCacheKey(original), translate);
        console.log("Translation saved to cache: " + translate);
        printNumberOfTranslationsInCache();
    }

    function loadFromCache(original) {
        var cachedTranslation = localStorage.getItem(getCacheKey(original));

        if (cachedTranslation !== null) {
            console.log("Translation loaded from cache: " + cachedTranslation);
            printNumberOfTranslationsInCache();

            return cachedTranslation;
        }

        return null;
    }

    function translateText(text, callback) {
        var cachedTranslation = loadFromCache(text);

        if (cachedTranslation !== null) {
            callback(cachedTranslation, loadFromCacheEmojiFlag(cachedTranslation));
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
                        saveToCacheEmojiFlag(result.translate, !result.approved);
                        callback(result.translate, !result.approved);
                    } else {
                        console.log("Invalid translation received for: " + text);
                        callback("Ошибка: не получилось перевести.", false);
                    }
                }
            });
        }
    }

    function getElementWithTranslation(originalElement) {
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
            if (!element.id) {
                element.id = 'random-' + Math.floor(Math.random() * 1000000);
            }

            var id = element.id;

            if (!id.includes('-cloned')) {
                var originalTextWithNoTranslate = element.innerHTML.replace(/<translation>.*?<\/translation>/g, '').replace(/<\/?[^>]+(>|$)/g, '').trim();

                if (originalTextWithNoTranslate !== '' && originalTextWithNoTranslate !== contentCache[id]) {
                    console.log("");
                    console.log("Element changed OLD: '" + originalTextWithNoTranslate + "'")
                    console.log("NEW: '" + contentCache[id] + "'")
                    console.log("");
                    contentCache[id] = originalTextWithNoTranslate;

                    if (id && id.endsWith('-answer')) {
                        translateText(originalTextWithNoTranslate, function(translatedText, showEmojis) {
                            element.innerHTML = originalTextWithNoTranslate + '<translation><br /><b></b><br /><br /></translation>';
                            const translationElement = element.querySelector('b');
                            addLinksToSignCodes(translationElement, translatedText, showEmojis);
                        });
                    } else if (selector.includes('page_title')) {
                        translateText(originalTextWithNoTranslate, function(translatedText, showEmojis) {
                            element.innerHTML = originalTextWithNoTranslate + '<translation><br /></translation>';
                            const translationElement = element.querySelector('translation');
                            addLinksToSignCodes(translationElement, translatedText, showEmojis);
                        });
                    } else {
                        var clonedContent = getElementWithTranslation(element)
                        clonedContent.style.display = 'none';

                        translateText(originalTextWithNoTranslate, function(translatedText, showEmojis) {
                            clonedContent.innerHTML = '';
                            addLinksToSignCodes(clonedContent, translatedText, showEmojis);
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
