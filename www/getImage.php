<?php

if (isset($_GET['id']) && preg_match('/^[a-zA-Z]-[0-9]{1,}[a-zA-Z]{0,}?$/', $_GET['id'])) {
    $filePath = __DIR__ . '/znaki/' . strtoupper($_GET['id']) . '.png';

    if (file_exists($filePath)) {
        header('Content-Type: image/png');
        readfile($filePath);
    } else {
        header("HTTP/1.0 404 Not Found");
        echo "File not found";
    }
} else {
    header("HTTP/1.0 400 Bad Request");
    echo "Invalid request";
}