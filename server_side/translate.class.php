<?php

class Translate
{
    const API_URL = 'https://translate.api.cloud.yandex.net/translate/v2/translate';
    const YANDEX_API_KEY_FILE = '../yandex_api_key.txt';
    const OPEN_AI_API_KEY_FILE = '../open_ai_api_key.txt';
    const CHAT_GPT_PROMPT_FILE = 'chat_gpt_prompt.json';
    const TRANSLATIONS_FILE = 'translations.json';

    const INCORRECT = 'INCORRECT';
    const NOT_APPROVED = 'NOT_APPROVED';
    const APPROVED = 'APPROVED';

    private static function requestOpenAI($systemMessage, $userData)
    {
        $filename = __DIR__ . '/' . self::OPEN_AI_API_KEY_FILE;

        if (!is_file($filename)) {
            return array(
                'translate' => null,
                'error' => 'The file with the API key not found.'
            );
        }

        $lines = file($filename, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        $data = [
            'model' => 'gpt-4-1106-preview',
            'messages' => [
                ['role' => 'system', 'content' => $systemMessage],
                ['role' => 'user', 'content' => 'Фрагмент для перевода: "' . $userData . '"']
            ]
        ];

        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . trim($lines[array_rand($lines)])
        ];

        $ch = curl_init('https://api.openai.com/v1/chat/completions');
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

        $response = curl_exec($ch);

        if (curl_errno($ch)) {
            throw new Exception(curl_error($ch));
        }

        $decodedResponse = json_decode($response, true);
        curl_close($ch);

        $translation = $decodedResponse['choices'][0]['message']['content'] ?? null;

        return array(
            'translate' => $translation,
            'approved' => false,
            'info' => empty($decodedResponse['error']['message']) ? [$decodedResponse['model'], $decodedResponse['usage']] : null,
            'error' => $decodedResponse['error']['message'] ?? null
        );
    }


    private static function translateViaYandexApi($text)
    {
        if (!is_file(__DIR__ . '/' . self::YANDEX_API_KEY_FILE)) {
            return array(
                'translate' => null,
                'error' => 'The file with the API key not found.'
            );
        }

        $headers = [
            'Content-Type: application/json',
            'Authorization: Api-Key ' . trim(file_get_contents(__DIR__ . '/' . self::YANDEX_API_KEY_FILE))
        ];

        $body = json_encode([
            'texts' => [$text],
            'sourceLanguageCode' => 'pl',
            'targetLanguageCode' => 'ru'
        ]);

        $ch = curl_init(self::API_URL);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        curl_close($ch);

        $decodedResponse = json_decode($response, true);

        if ($httpCode == 200) {
            return array(
                'translate' => $decodedResponse['translations'][0]['text'],
                'error' => null
            );
        } else {
            return array(
                'translate' => null,
                'error' => $decodedResponse['message']
            );
        }
    }

    private static function loadTranslations()
    {
        $path = __DIR__ . '/' . self::TRANSLATIONS_FILE;

        if (file_exists($path)) {
            return json_decode(file_get_contents($path), true);
        } else {
            return [];
        }
    }

    private static function findOriginalByTranslation(string $translation)
    {
        $translations = self::loadTranslations();
        $original = array_search($translation, $translations['not_approved']);

        if ($original) {
            return [$original, false];
        }

        return null;
    }

    public static function approveTranslation(string $translation)
    {
        $original = self::findOriginalByTranslation($translation);

        if ($original) {
            self::saveToTranslations($original[0], $translation, self::APPROVED);

            return true;
        }

        return false;
    }

    public static function markTranslationAsIncorrect(string $translation)
    {
        $original = self::findOriginalByTranslation($translation);

        if ($original) {
            self::saveToTranslations($original[0], $translation, self::INCORRECT);

            return true;
        }

        return false;
    }

    private static function removeTranslation(string $original)
    {
        $translations = self::loadTranslations();
        unset($translations['not_approved'][$original]);
        unset($translations['incorrect'][$original]);

        return $translations;
    }

    private static function saveToTranslations(string $original, string $translation, $type)
    {
        $translations = self::removeTranslation($original);

        if ($type == self::APPROVED) {
            $translations['approved']['others'][$original] = $translation;
        } elseif ($type == self::INCORRECT) {
            $translations['incorrect'][$original] = $translation;
        } else {
            $translations['not_approved'][$original] = $translation;
        }

        file_put_contents(
            __DIR__ . '/' . self::TRANSLATIONS_FILE,
            json_encode($translations, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );
    }

    private static function replaceRoadSignCyrillicCodes($text)
    {
        $replacement = function ($matches) {
            return strtr(
                $matches[0],
                [
                    'А' => 'A',
                    'В' => 'B',
                    'С' => 'C',
                    'Е' => 'E',
                    'Н' => 'H',
                    'Р' => 'P',
                    'Т' => 'T',
                    'а' => 'a',
                    'в' => 'b',
                    'с' => 'c',
                    'е' => 'e',
                    'н' => 'h',
                    'р' => 'p',
                    'т' => 't',
                ]
            );
        };

        return preg_replace_callback('/\b([А-ЯA-Z]-\d+[A-Za-zА-Яа-я]?)/u', $replacement, $text);
    }

    private static function generatePrompt($text)
    {
        $promptData = json_decode(file_get_contents(__DIR__ . '/' . self::CHAT_GPT_PROMPT_FILE), true);
        $dictionaryIntro = '';
        $dictionary = [];
        $comments = [];

        foreach ($promptData['dictionary'] as $line => $searchList) {
            foreach ($searchList as $search) {
                if (stripos($text, $search) !== false) {
                    $dictionary[$line] = null;
                    $dictionaryIntro = PHP_EOL . $promptData['dictionary_intro'] . PHP_EOL;
                }
            }
        }

        foreach ($promptData['comments'] as $line => $searchList) {
            foreach ($searchList as $search) {
                if (stripos($text, $search) !== false) {
                    $comments[$line] = null;
                }
            }
        }

        $prompt = str_ireplace('%comments%', trim(join(' ', array_keys($comments))), $promptData['prompt']);
        $prompt = str_ireplace('%dictionary_intro%', $dictionaryIntro, $prompt);
        $prompt = str_ireplace('%dictionary%', trim(join(PHP_EOL, array_keys($dictionary))), $prompt);
        $prompt = str_ireplace(
            '%short_notice%',
            strlen($text) < 30 ? $promptData['short_notice'] : '',
            $prompt
        );

        return trim($prompt);
    }

    private static function findInTranslations($original)
    {
        $translations = self::loadTranslations();

        foreach ($translations['approved'] as $category) {
            if (array_key_exists($original, $category)) {
                return [$category[$original], true];
            }
        }

        if (array_key_exists($original, $translations['not_approved'])) {
            return [$translations['not_approved'][$original], false];
        }

        return null;
    }

    public static function performTranslation($text)
    {
        $text = preg_replace('/([A-Z])\s*-\s*(\d+[a-z]?)/', '$1-$2', $text);
        $text = trim(preg_replace('/\s{1,}/', ' ', $text));

        if (is_numeric($text)) {
            $result = array(
                'translate' => $text,
                'info' => 'A number: no need to translate',
                'error' => null
            );
        } else {
            $tranlation = self::findInTranslations($text);

            if ($tranlation === null) {
                $translationResult = self::requestOpenAI(
                    self::generatePrompt($text),
                    $text
                );

                if ($translationResult['translate'] !== null) {
                    self::saveToTranslations($text, $translationResult['translate'], self::NOT_APPROVED);
                }

                $result = $translationResult;
            } else {
                $result = array(
                    'translate' => $tranlation[0],
                    'approved' => $tranlation[1],
                    'error' => null
                );
            }
        }

        if (!empty($result['translate'])) {
            $result['translate'] = trim(self::replaceRoadSignCyrillicCodes($result['translate']), '"');
            $additional = '';

            if (stripos($text, 'zterokoł')) {
                $additional .= '"czterokołowec" - масса до 400 кг в случае перевозки людей и масса до 550 кг в случае перевозки грузов';

                if (stripos($text, 'lekk')) {
                    $additional .= ', "czterokołowec lekki" - это масса до 350 кг и скорость до 45 км/ч';
                }
            }

            if ($additional) {
                $result['translate'] .= ' (' . $additional . ')';
            }
        }

        return $result;
    }
}
