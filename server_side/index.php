<?php

require_once __DIR__ . '/translate.class.php';

header('Content-Type: application/json');

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

function prepareText(string $text)
{
    if (preg_match('/^([0-9]{1,}\.\s)(.*)$/', $text, $matches)) {
        $prefix = $matches[1];
        $text = trim($matches[2]);
    } else {
        $prefix = '';
        $text = trim($text);
    }

    return ['text' => $text, 'prefix' => $prefix];
}

if (isset($input['text'])) {
    $prepared = prepareText($input['text']);
    $result = Translate::performTranslation($prepared['text']);

    if ($result['translate']) {
        $result['translate'] = $prepared['prefix'] . $result['translate'];
    }

    echo json_encode($result, JSON_UNESCAPED_UNICODE);
} elseif (isset($input['approve'])) {
    $prepared = prepareText($input['approve']);
    Translate::approveTranslation($prepared['text']);

    echo json_encode(['error' => null], JSON_UNESCAPED_UNICODE);
} elseif (isset($input['mark_incorrect'])) {
    $prepared = prepareText($input['mark_incorrect']);
    Translate::approveTranslation($prepared['text']);

    echo json_encode(['error' => null], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['error' => 'No text provided']);
}
