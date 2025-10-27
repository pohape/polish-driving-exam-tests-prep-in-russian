(function () {
    'use strict';

    const baseUrl = 'https://jazda.webscrapp.rocks/'
    const signsImagesBasePath = 'https://raw.githubusercontent.com/pohape/polish-driving-exam-tests-in-russian/main/images/znaki/'

    const regexRegistrationDate = /Konto zostało utworzone: (.*?)<\/p>/;
    const switchAdditionalPlaceSelectors = [
        '#learnings-list > div:nth-child(1) > div:nth-child(2)',
        '#learning-check > div:nth-child(5)'
    ]

    const selectorLogout = "//a[@href='/wyloguj']"
    const selectors = {
        "question": [
            '#question-content',
            '#report-question-content',
            "#q-result-question",
            "//div[contains(@class, 'container') and contains(@class, 'margin-bottom')]/div[1]/div[1]/div[not(contains(@class, 'toggle-switch'))][1]"
        ],
        "others": [
            "//div[@id='q-result-answers']/div[child::node()[self::text()]]",
            '#a-answer',
            '#b-answer',
            '#c-answer',
            '#report-explanation',
            '#q-result-explanation',
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
        ]
    };

    let selectorsToRemove = [
        {
            selector: '.mail-us-wrapper',
            deleteLevel: 0
        },
        {
            selector: 'div.row > div.col-xs-12 > p',
            deleteLevel: 1
        },
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

    let registrationDate = null
    let contentCache = {};
    let favoritesObject = {};
    let switchIds = new Set();

    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }

        return Math.abs(hash).toString();
    }

    function loadRegistrationDateAndFavorites() {
        let xpathResult = document.evaluate(
            selectorLogout,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        );

        if (xpathResult.singleNodeValue) {
            registrationDate = loadFromCacheRegistrationDate()
            console.log("The user is logged in. Registration date from the cache: " + registrationDate);
            favoritesObject = loadFavoritesFromCache()

            fetch('/moje-konto')
                .then(response => response.text())
                .then(html => {
                    let match = html.match(regexRegistrationDate);

                    if (match) {
                        registrationDate = match[1]
                        saveToCacheRegistrationDate(registrationDate)

                        if (window.location.pathname === '/moje-konto') {
                            makeHttpRequest('favorites/getFull', {registration_date: registrationDate}, function (result) {
                                if (result.favorites_full) {
                                    createFavoriteQuestionsElement(result.favorites_full)
                                }
                            });
                        } else {
                            loadFavorites(registrationDate)
                        }
                    }
                })
                .catch(error => console.error('Error fetching the data:', error));
        } else {
            console.log("The user is logged out");
            registrationDate = null
            saveToCacheRegistrationDate(registrationDate)
        }
    }

    function addMenuItem(menuTitle, menuLink) {
        const menu = document.getElementById('nav');

        if (!menu) {
            console.error('Menu element not found');
            return;
        }

        const newMenuItem = document.createElement('li');
        const link = document.createElement('a');

        link.target = "_blank"
        link.href = menuLink;
        link.textContent = menuTitle;
        link.style.fontWeight = 'bold';
        link.style.animation = 'blink 1s step-start infinite';

        newMenuItem.appendChild(link);
        menu.prepend(newMenuItem);
    }

    function createHint(mouseX, mouseY) {
        const hintDiv = document.createElement('div');

        hintDiv.style.position = 'fixed';
        hintDiv.style.top = mouseY + 'px';
        hintDiv.style.left = mouseX + 'px';
        hintDiv.style.zIndex = '1000';
        hintDiv.style.border = '1px solid black';
        hintDiv.style.backgroundColor = 'white';
        hintDiv.style.padding = '5px';
        hintDiv.style.boxShadow = '0px 0px 10px rgba(0,0,0,0.5)';
        document.body.appendChild(hintDiv);

        return hintDiv
    }

    function createImgHint(src, mouseX, mouseY) {
        let hintDiv = createHint(mouseX, mouseY)

        const img = document.createElement('img');
        img.src = src;
        img.style.width = '200px';
        img.style.height = 'auto';

        hintDiv.appendChild(img);

        return hintDiv;
    }

    function createTextHint(text, mouseX, mouseY) {
        let hintDiv = createHint(mouseX, mouseY)
        hintDiv.style.pointerEvents = 'none';
        hintDiv.style.maxWidth = '400px';
        hintDiv.style.wordWrap = 'break-word';

        const textNode = document.createElement('span');
        textNode.textContent = text;
        hintDiv.appendChild(textNode);

        return hintDiv;
    }

    function makeHttpRequest(endpoint, data, callback) {
        const url = baseUrl + endpoint;
        const requestData = {
            action: 'makeHttpRequest',
            url: url,
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            data: JSON.stringify(data)
        };

        chrome.runtime.sendMessage(requestData, response => {
            if (response.success) {
                callback(response.data);
            } else {
                console.error('Error:', response.error);
            }
        });
    }

    function sendTranslationFeedback(translation, endpoint) {
        let switchState = loadFromCacheSwitchState()
        localStorage.clear();
        saveToCacheSwitchState(switchState)
        saveToCacheRegistrationDate(registrationDate)

        makeHttpRequest(endpoint, {text: translation}, function (result) {
            console.log(endpoint + " " + translation + ": " + result);
        });
    }

    function markTranslationAsIncorrect(translation) {
        sendTranslationFeedback(translation, 'translations/markIncorrect');
    }

    function markTranslationAsCorrect(translation) {
        sendTranslationFeedback(translation, 'translations/markCorrect');
    }

    function createLikeOrDislikeEmojiLink(span, onClickHandler, itIsLike = true) {
        const link = document.createElement('a');
        link.href = '#';
        link.innerHTML = itIsLike ? ' 👍' : ' 👎';
        link.onclick = (e) => {
            e.preventDefault();
            span.innerHTML = ' ✅';
            onClickHandler();
        };

        span.appendChild(link);
    }

    function createFavoritesEmojiLink(span, text) {
        const titleAdd = 'Добавить в список сложных';
        const titleRemove = 'Убрать из списка сложных';
        const emojiAdded = ' ⭐ ';
        const emojiNotAdded = ' ☆ ';

        const match = window.location.href.match(/,(\d+)$/);
        let questionId = match ? match[1] : null;
        let addedToFavorites = questionId ? localFavoritesFindQuestionId(questionId) : localFavoritesCheckText(text);

        const link = document.createElement('a');
        let hintText

        if (registrationDate) {
            hintText = addedToFavorites ? titleRemove : titleAdd;
            link.href = '#';
            link.innerHTML = addedToFavorites ? emojiAdded : emojiNotAdded;

            link.onclick = (e) => {
                e.preventDefault();
                addedToFavorites = !addedToFavorites;
                link.innerHTML = addedToFavorites ? emojiAdded : emojiNotAdded;
                hintText = addedToFavorites ? titleRemove : titleAdd;

                if (addedToFavorites) {
                    addToFavoritesIfNotPresent(text, questionId)
                } else {
                    removeFromFavorites(text, questionId)
                }
            };
        } else {
            hintText = 'Для добавления вопроса в "избранные" нужно зарегистрироваться и авторизоваться на этом сайте (никакие личные данные никуда не передаются, в плагине для ведения списка избранных вопросов используется только обезличенный идентификатор вашего аккаунта)'
            link.href = '/zaloguj'
            link.target = '_blank'
            link.innerHTML = emojiNotAdded
        }

        let hintElement;

        link.onmouseover = (e) => {
            hintElement = createTextHint(
                hintText,
                e.clientX + 10,
                e.clientY + 10
            );
        };

        link.onmouseout = () => {
            if (hintElement) document.body.removeChild(hintElement);
        };

        span.appendChild(link);
    }

    function localFavoritesCheckText(text) {
        return Object.values(favoritesObject).includes(text);
    }

    function localFavoritesFindQuestionId(questionId) {
        if (questionId in favoritesObject) {
            return favoritesObject[questionId];
        }

        return null;
    }

    function localFavoritesAddByQuestionId(questionId, text) {
        favoritesObject[questionId] = text;
        console.log('Added to local Favorites: ' + questionId);
    }

    function localFavoritesRemoveByText(text) {
        for (let key in favoritesObject) {
            if (favoritesObject[key] === text) {
                delete favoritesObject[key];
                console.log(`'${key}' was removed from Favorites.`);
            }
        }
    }

    function localFavoritesRemoveById(questionId) {
        if (questionId in favoritesObject) {
            delete favoritesObject[questionId];
            console.log('Removed from local Favorites: ' + questionId);
        }
    }

    function addToFavoritesIfNotPresent(translation, questionId) {
        if (questionId) {
            if (localFavoritesFindQuestionId(questionId)) {
                console.log('Already is in local Favorites: ' + translation);
            } else {
                localFavoritesAddByQuestionId(questionId, translation)
            }
        }

        makeHttpRequest(
            'favorites/add',
            {question_or_id: (questionId ? questionId : translation), registration_date: registrationDate},
            function (result) {
                if (result.error === null) {
                    console.log('Added to API Favorites: ' + translation);
                    setFavorites(result)
                } else {
                    console.log('Error adding to API Favorites: ' + translation);
                }
            }
        );
    }

    function removeFromFavorites(text, questionId) {
        if (questionId) {
            localFavoritesRemoveById(questionId)
        } else {
            localFavoritesRemoveByText(text);
        }

        let questionOrId = questionId ? questionId : text

        makeHttpRequest(
            'favorites/remove',
            {question_or_id: questionOrId, registration_date: registrationDate},
            function (result) {
                if (result.error === null) {
                    console.log('Removed from API Favorites: ' + questionOrId);
                    setFavorites(result)
                } else {
                    console.log('Error removing from API Favorites: ' + questionOrId);
                }
            }
        );
    }

    function setSwitchState(event = null) {
        let switchIsOn = event ? event.target.checked : loadFromCacheSwitchState();

        switchIds.forEach(id => {
            let switchElement = document.getElementById(id);

            if (switchElement) {
                switchElement.checked = switchIsOn
            }
        });

        document.querySelectorAll('.translation').forEach(element => {
            element.style.display = switchIsOn ? 'block' : 'none';
        });

        saveToCacheSwitchState(switchIsOn)
    }

    function createAndInsertToggleSwitch(element, id) {
        const div = document.createElement('div');
        div.className = 'toggle-switch';
        div.style.display = 'block';

        div.style.marginLeft = '0px';
        div.style.marginRight = '5px';
        div.style.marginTop = '5px';
        div.style.marginBottom = '0px';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = id;
        input.hidden = true;
        input.checked = loadFromCacheSwitchState()
        switchIds.add(id);
        input.addEventListener('change', setSwitchState);

        const label = document.createElement('label');
        label.setAttribute('for', id);
        label.className = 'switch';

        div.appendChild(input);
        div.appendChild(label);
        element.prepend(div);
    }

    function prepareTranslationElementAndAddToDom(category, element, translation, originalText) {
        if (category === 'question') {
            const spanForFavorite = document.createElement('span');
            createFavoritesEmojiLink(spanForFavorite, originalText);
            element.appendChild(spanForFavorite);
        }

        const regex = /\b([A-Z]-\d+[A-Za-z]?)\b/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(translation)) !== null) {
            const beforeMatch = document.createElement('b');
            beforeMatch.textContent = translation.substring(lastIndex, match.index);
            element.appendChild(beforeMatch);

            const link = document.createElement('a');
            link.href = signsImagesBasePath + match[1].toUpperCase() + '.png';
            link.textContent = match[1];

            let hintElement;

            link.onmouseover = (e) => {
                const mouseX = e.clientX + 10;
                const mouseY = e.clientY + 10;
                hintElement = createImgHint(link.href, mouseX, mouseY);
            };

            link.onmouseout = () => {
                if (hintElement) document.body.removeChild(hintElement);
            };
            element.appendChild(link);

            lastIndex = regex.lastIndex;
        }

        if (lastIndex < translation.length) {
            const remainingText = document.createElement('b');
            remainingText.textContent = translation.substring(lastIndex);
            element.appendChild(remainingText);
        }

        const span = document.createElement('span');

        if (loadFromCacheEmojiFlag(translation)) {
            createLikeOrDislikeEmojiLink(span, () => markTranslationAsCorrect(translation), true);
            span.appendChild(document.createTextNode(' '));
            createLikeOrDislikeEmojiLink(span, () => markTranslationAsIncorrect(translation), false);
        } else {
            span.innerHTML = ' ✅';
        }

        element.classList.add('translation');
        element.appendChild(span);

        setSwitchState()
    }

    function getCacheKey(originalText) {
        return 'translationCache_' + simpleHash(originalText);
    }

    function getCacheKeyForEmojiFlags(translation) {
        return 'emojiFlagsCache_' + simpleHash(translation);
    }

    function saveToCacheEmojiFlag(translate, flag) {
        localStorage.setItem(getCacheKeyForEmojiFlags(translate), flag ? '1' : '0');
    }

    function loadFromCacheEmojiFlag(translate) {
        return localStorage.getItem(getCacheKeyForEmojiFlags(translate)) === '1';
    }

    function saveToCacheSwitchState(isItEnabled) {
        localStorage.setItem('translation_switch_state', isItEnabled ? '1' : '0');
    }

    function loadFromCacheSwitchState() {
        return localStorage.getItem('translation_switch_state') === '1';
    }

    function saveToCacheRegistrationDate(registrationDate) {
        console.log('Save the registration date: "' + registrationDate + '"');
        localStorage.setItem('registration_date', registrationDate);
    }

    function loadFromCacheRegistrationDate() {
        return localStorage.getItem('registration_date');
    }

    function saveTranslateToCache(original, translate) {
        localStorage.setItem(getCacheKey(original), translate);
    }

    function loadTranslateFromCache(original) {
        let cachedTranslation = localStorage.getItem(getCacheKey(original));

        if (cachedTranslation !== null) {
            return cachedTranslation;
        }

        return null;
    }

    function saveFavoritesToCache(favorites) {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }

    function loadFavoritesFromCache() {
        const jsonData = localStorage.getItem('favorites');
        const favoritesFromCache = jsonData ? JSON.parse(jsonData) : {}
        console.log("Favorites from the cache:");
        console.log(Object.keys(favoritesFromCache));

        return favoritesFromCache;
    }

    function translateText(text, callback) {
        let cachedTranslation = loadTranslateFromCache(text);

        if (cachedTranslation !== null) {
            callback(cachedTranslation);
        } else {
            makeHttpRequest('translations/get', {text: text}, function (result) {
                if (result.translation && result.translation.trim() !== '') {
                    saveTranslateToCache(text, result.translation);
                    saveToCacheEmojiFlag(result.translation, !result.approved);
                    callback(result.translation);
                } else {
                    console.log('Invalid translation received for: ' + text);
                    callback('Ошибка: не получилось перевести.', false);
                }
            });
        }
    }

    function getElementWithTranslation(originalElement) {
        let originalId = originalElement.id;
        let clonedId = originalId + '-cloned';
        let clonedContent = document.getElementById(clonedId);

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

    function processSwitch(selector) {
        let id = 'toggle-switch-' + selector.length
        let switchElement = document.getElementById(id);

        if (!switchElement) {
            let element;

            if (selector.startsWith('/')) {
                const xpathResult = document.evaluate(
                    selector,
                    document,
                    null,
                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                    null
                );

                if (xpathResult.snapshotLength > 0) {
                    element = xpathResult.snapshotItem(0);
                }
            } else {
                element = document.querySelector(selector);
            }

            if (element) {
                createAndInsertToggleSwitch(element, id);
            }
        }
    }

    function processSelector(selector, category) {
        try {
            if (selector.startsWith('/')) {
                const result = document.evaluate(
                    selector,
                    document,
                    null,
                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                    null
                );

                for (let i = 0; i < result.snapshotLength; i++) {
                    const element = result.snapshotItem(i);

                    if (element) {
                        processElement(element, selector, category);
                    }
                }
            } else {
                document.querySelectorAll(selector).forEach(element => {
                    processElement(element, selector, category);
                });
            }
        } catch (error) {
            console.error('Error processing selector:', selector, 'Error:', error);
        }
    }

    function processElement(element, selector, category) {
        if (!element.id) {
            element.id = 'random-' + Math.floor(Math.random() * 1000000);
        }

        let id = element.id;

        if (!id.includes('-cloned')) {
            let originalTextWithNoTranslate = element.innerHTML.replace(/<translation>.*?<\/translation>/g, '').replace(/<\/?[^>]+(>|$)/g, '').trim();

            if (originalTextWithNoTranslate !== '' && originalTextWithNoTranslate !== contentCache[id]) {
                contentCache[id] = originalTextWithNoTranslate;

                if (id && id.endsWith('-answer')) {
                    translateText(originalTextWithNoTranslate, function (translatedText) {
                        element.innerHTML = originalTextWithNoTranslate + '<translation><br /><b></b><br /><br /></translation>';
                        const translationElement = element.querySelector('b');
                        prepareTranslationElementAndAddToDom(
                            category,
                            translationElement,
                            translatedText,
                            originalTextWithNoTranslate
                        );
                    });
                } else if (selector.includes('page_title')) {
                    translateText(originalTextWithNoTranslate, function (translatedText) {
                        element.innerHTML = originalTextWithNoTranslate + '<translation><br /></translation>';
                        const translationElement = element.querySelector('translation');
                        prepareTranslationElementAndAddToDom(
                            category,
                            translationElement,
                            translatedText,
                            originalTextWithNoTranslate
                        );
                    });
                } else {
                    let clonedContent = getElementWithTranslation(element);
                    clonedContent.style.display = 'none';

                    translateText(originalTextWithNoTranslate, function (translatedText) {
                        clonedContent.innerHTML = '';
                        prepareTranslationElementAndAddToDom(
                            category,
                            clonedContent,
                            translatedText,
                            originalTextWithNoTranslate
                        );
                    });
                }
            }
        }
    }

    function setFavorites(result) {
        if (result.error === null && typeof result.favorites === 'object' && result.favorites !== null) {
            favoritesObject = result.favorites;
            saveFavoritesToCache(favoritesObject)
            console.log('Favorites loaded successfully from API:', Object.keys(favoritesObject));
        } else {
            console.error('Failed to load favorites from API:', result.error);
        }
    }

    function loadFavorites(registrationDate) {
        makeHttpRequest('favorites/get', {registration_date: registrationDate}, function (result) {
            if (result.favorites) {
                setFavorites(result)
                addMenuItem(
                    'ИЗБРАННОЕ',
                    'https://www.teoria.pl/moje-konto'
                )
            }
        });
    }

    function createFavoriteQuestionsElement(favorites) {
        const container = document.createElement('div');
        container.className = 'row'
        container.appendChild(document.createElement('br'));
        container.appendChild(document.createElement('br'));
        container.appendChild(document.createElement('br'));

        const header = document.createElement('h2');
        header.textContent = 'Мои избранные вопросы';
        container.appendChild(header);
        container.appendChild(document.createElement('br'));

        Object.keys(favorites).forEach(question => {
            const questionHeader = document.createElement('h3');
            questionHeader.textContent = question;
            container.appendChild(questionHeader);

            const list = document.createElement('ol');
            favorites[question].forEach(id => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = `https://www.teoria.pl/pytania-na-prawo-jazdy-z-odpowiedziami/,${id}`;
                link.textContent = id;
                link.target = '_blank';
                listItem.appendChild(link);
                list.appendChild(listItem);
            });
            container.appendChild(list);
        });

        const container2 = document.createElement('div');
        container2.className = 'container'
        container2.appendChild(container);
        document.body.insertBefore(container2, document.querySelector('body > footer'));
    }

    loadRegistrationDateAndFavorites()
    let emptyRemoved = false;

    setInterval(function () {
        for (let category in selectors) {
            selectors[category].forEach(selector => processSelector(selector, category));
        }

        switchAdditionalPlaceSelectors.concat(selectors['question']).forEach(selector => processSwitch(selector));
        const consentButton = document.querySelector('button.fc-button.fc-cta-consent.fc-primary-button');

        if (consentButton && !consentButton.classList.contains('clicked')) {
            consentButton.classList.add('clicked');
            consentButton.click();
        }

        let videoElement = document.getElementById('video');

        if (videoElement) {
            videoElement.controls = true;
        }

        let imgElement = document.querySelector('img.img-responsive');

        imgElement.addEventListener('click', function () {
            if (imgElement.requestFullscreen) {
                imgElement.requestFullscreen();
            } else if (imgElement.mozRequestFullScreen) {
                imgElement.mozRequestFullScreen();
            } else if (imgElement.webkitRequestFullscreen) {
                imgElement.webkitRequestFullscreen();
            } else if (imgElement.msRequestFullscreen) {
                imgElement.msRequestFullscreen();
            }
        });

        selectorsToRemove.forEach(function (item) {
            let elements = document.querySelectorAll(item.selector);

            elements.forEach(function (element) {
                let elementToRemove = element;

                for (let i = 0; i < item.deleteLevel; i++) {
                    if (elementToRemove.parentNode) {
                        elementToRemove = elementToRemove.parentNode;
                    } else {
                        break;
                    }
                }

                if (elementToRemove && elementToRemove.parentNode) {
                    elementToRemove.parentNode.removeChild(elementToRemove);
                }
            });
        });

        if (!emptyRemoved) {
            let elementToRemove = document.querySelector('section.breadcumb_area + *');

            if (elementToRemove) {
                elementToRemove.parentNode.removeChild(elementToRemove);
                emptyRemoved = true;
            }
        }
    }, 100);

    let style = document.createElement('style');
    style.type = 'text/css';

    style.innerHTML = `
    @keyframes blink {
        50% { opacity: 0; }
    }
    .breadcumb_area {
        height: 170px !important;
    }
    .breadcumb_section {
        margin-top: 33px !important;
    }
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 60px;
      height: 34px;
    }
    .switch {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
      border-radius: 34px;
    }
    .switch:before {
      position: absolute;
      content: "";
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
    input:checked + .switch {
      background-color: #2196F3;
    }
    input:checked + .switch:before {
      transform: translateX(26px);
    }`;

    document.head.appendChild(style);
})();
