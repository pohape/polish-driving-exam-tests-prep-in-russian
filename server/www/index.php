<?php

require_once __DIR__ . '/../translate.class.php';
require_once __DIR__ . '/../favorites.class.php';

header('Content-Type: application/json');

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

function prepareText(string $text)
{
    if (preg_match('/^([0-9A-F]\.\s)(.*)$/', $text, $matches)) {
        $prefix = $matches[1];
        $text = trim($matches[2]);
    } else {
        $prefix = '';
        $text = trim($text);
    }

    return ['text' => $text, 'prefix' => $prefix];
}

try {
    $favorites = new Favorites();
    $translate = new Translate();

    if (isset($input['text'])) {
        $prepared = prepareText($input['text']);
        $result = $translate->performTranslation($prepared['text']);

        if ($result['translate']) {
            $result['translate'] = $prepared['prefix'] . $result['translate'];
        }

        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    } elseif (isset($input['approve'])) {
        $prepared = prepareText($input['approve']);

        echo json_encode(
            ['error' => null, 'success' => $translate->approveTranslation($prepared['text'])],
            JSON_UNESCAPED_UNICODE
        );
    } elseif (isset($input['mark_incorrect'])) {
        $prepared = prepareText($input['mark_incorrect']);

        echo json_encode(
            ['error' => null, 'success' => $translate->markTranslationAsIncorrect($prepared['text'])],
            JSON_UNESCAPED_UNICODE
        );
    } elseif (isset($input['registration_date'])) {
        if (isset($input['add_to_favorites'])) {
            echo json_encode(
                [
                    'error' => null,
                    'success' => $favorites->add(
                        $input['add_to_favorites'],
                        $input['registration_date']
                    ),
                    'favorites' => $favorites->getFavoritesShort($input['registration_date'])
                ],
                JSON_UNESCAPED_UNICODE
            );
        } elseif (isset($input['remove_from_favorites'])) {
            echo json_encode(
                [
                    'error' => null,
                    'success' => $favorites->remove(
                        $input['remove_from_favorites'],
                        $input['registration_date']
                    ),
                    'favorites' => $favorites->getFavoritesShort($input['registration_date'])
                ],
                JSON_UNESCAPED_UNICODE
            );
        } else {
            echo json_encode(
                ['error' => null, 'favorites' => $favorites->getFavoritesShort($input['registration_date'])],
                JSON_UNESCAPED_UNICODE
            );
        }
    } else {
        echo json_encode(
            ['error' => null],
            JSON_UNESCAPED_UNICODE
        );
    }
} catch (Exception $e) {
    echo json_encode(
        ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()],
        JSON_UNESCAPED_UNICODE
    );
}
