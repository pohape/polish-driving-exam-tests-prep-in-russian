<?php
$maxId = 19055;
$baseUrl = 'https://www.teoria.pl/pytania-na-prawo-jazdy-z-odpowiedziami/,';
$context = stream_context_create(array('http' => array('ignore_errors' => true)));

for ($id = 1; $id <= $maxId; $id++) {
    $path = 'temp_html_files/' . $id . '.html';

    if (is_file($path)) {
        continue;
    }

    echo $id . PHP_EOL;

    $content = @file_get_contents($baseUrl . $id, false, $context);

    // Проверяем наличие переменной $http_response_header, чтобы узнать статус ответа
    if (isset($http_response_header)) {
        $statusLine = $http_response_header[0];
        preg_match('{HTTP/\S*\s(\d{3})}', $statusLine, $statusCode);
        echo 'Response: ' . $statusCode[1] . PHP_EOL . PHP_EOL;
    } else {
        echo '$http_response_header not found:' . PHP_EOL;
        var_dump($content);
        exit();
    }

    if ($content === false || $statusCode[1] == 404) {
        $content = '';
    }

    file_put_contents($path, $content);
}
