<?php


class Translate {
    const API_URL = 'https://translate.api.cloud.yandex.net/translate/v2/translate';
    const API_KEY_FILE = 'api_key.txt';
    const CACHE_FILE = 'cache.json';

    private static function translateViaApi($text) {
        $headers = [
            'Content-Type: application/json',
            'Authorization: Api-Key ' . file_get_contents(__DIR__ . '/' . self::API_KEY_FILE)
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

    public static function translate($text) {
        $cachePath = __DIR__ . '/' . self::CACHE_FILE;

        if (file_exists($cachePath)) {
            $cache = json_decode(file_get_contents($cachePath), true);
        } else {
            $cache = [];
        }

        if (isset($cache[$text])) {
            return array(
                'translate' => $cache[$text],
                'error' => null
            );
        } else {
            $translationResult = self::translateViaApi($text);

            if ($translationResult['error'] === null) {
                $cache[$text] = $translationResult['translate'];
                file_put_contents($cachePath, json_encode($cache, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            }

            return $translationResult;
        }
    }
}
