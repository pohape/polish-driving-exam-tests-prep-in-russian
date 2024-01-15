<?php

require_once __DIR__ . '/translate.class.php';

header('Content-Type: application/json');

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

if (isset($input['text'])) {
    if (preg_match('/^([0-9]{1,}\.\s)(.*)$/', $input['text'], $matches)) {
        $prefix = $matches[1];
        $text = trim($matches[2]);
    } else {
        $prefix = '';
        $text = trim($input['text']);
    }

    $result = Translate::performTranslation($text);

    if ($result['translate']) {
        $result['translate'] = $prefix . $result['translate'];
    }

    echo json_encode($result, JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['error' => 'No text provided']);
}
