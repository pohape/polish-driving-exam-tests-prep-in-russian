<?php
$dir = __DIR__ . '/temp_html_files/';
$filenames = scandir($dir);
array_shift($filenames);
array_shift($filenames);

$questions = array();

foreach ($filenames as $filename) {
    $dom = new DOMDocument();
    @$dom->loadHTML(file_get_contents($dir . $filename));
    $xpath = new DOMXPath($dom);
    $query = '/html/body/div[8]/div/div[1]/div[1]';
    $elements = $xpath->query($query);
    $question = trim($elements[0]->nodeValue);
    $id = intval(explode('.', $filename)[0]);

    if (!array_key_exists($question, $questions)) {
        $questions[$question] = array();
    }

    $questions[$question][] = $id;
}

file_put_contents(
    __DIR__ . '/../questions.json',
    json_encode($questions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);
