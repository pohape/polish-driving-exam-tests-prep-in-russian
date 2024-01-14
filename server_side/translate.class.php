<?php

class Translate {
    const API_URL = 'https://translate.api.cloud.yandex.net/translate/v2/translate';
    const YANDEX_API_KEY_FILE = '../yandex_api_key.txt';
    const OPEN_AI_API_KEY_FILE = '../open_ai_api_key.txt';
    const CHAT_GPT_PROMPT_FILE = 'chat_gpt_prompt.txt';
    const CACHE_FILE = 'cache.json';

    private static function requestOpenAI($systemMessage, $userData) {
        if (!is_file(__DIR__ . '/' . self::OPEN_AI_API_KEY_FILE)) {
            return array(
                'translate' => null,
                'error' => 'The file with the API key not found.'
            );
        }

        $data = [
            'model' => 'gpt-4-1106-preview',
            'messages' => [
                ['role' => 'system', 'content' => $systemMessage],
                ['role' => 'user', 'content' => $userData]
            ]
        ];

        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . trim(file_get_contents(__DIR__ . '/' . self::OPEN_AI_API_KEY_FILE))
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
            'error' => $decodedResponse['error']['message'] ?? null
        );
    }


    private static function translateViaYandexApi($text) {
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

    private static function loadCache() {
        $cachePath = __DIR__ . '/' . self::CACHE_FILE;

        if (file_exists($cachePath)) {
            return json_decode(file_get_contents($cachePath), true);
        } else {
            return [];
        }
    }

    private static function saveToCache(string $original, string $translation) {
        $cachePath = __DIR__ . '/' . self::CACHE_FILE;
        $cache = self::loadCache();
        $cache[$original] = $translation;

        file_put_contents($cachePath, json_encode($cache, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    public static function performTranslation($text) {
        $cache = self::loadCache();

        if (isset($cache[$text])) {
            return array(
                'translate' => $cache[$text],
                'error' => null
            );
        } else {
            $translationResult = self::requestOpenAI(
                trim(file_get_contents(__DIR__ . '/' . self::CHAT_GPT_PROMPT_FILE)),
                $text
            );

            if ($translationResult['translate'] !== null) {
                self::saveToCache($text, $translationResult['translate']);
            }

            return $translationResult;
        }
    }
}
