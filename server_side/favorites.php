<?php
require_once __DIR__ . '/favorites.class.php';
$baseUrl = 'https://www.teoria.pl/pytania-na-prawo-jazdy-z-odpowiedziami/,';

function notFound(string $registrationDate = null)
{
    header("HTTP/1.0 404 Not Found");
    echo '<h1>404 Not Found</h1>';
    echo '<p>Страница не найдена.</p>';

    if ($registrationDate) {
        echo sprintf('<p>%s</p>', $registrationDate);
    }

    exit();
}

if (empty($_GET['registration_date'])) {
    notFound();
}

$favorites = (new Favorites())->getFavoritesFull($_GET['registration_date']);

if (count($favorites) == 0) {
    notFound($_GET['registration_date']);
}

echo '<h2>Избранные вопросы для ' . $_GET['registration_date'] . '</h2>';

foreach ($favorites as $questionText => $questionIds) {
    echo sprintf('<h3>%s</h3>', $questionText);

    foreach ($questionIds as $questionId) {
        echo sprintf(
            '<li><a target="_blank" href="%s%s">%s</a></li>',
            $baseUrl,
            $questionId,
            $questionId
        );
    }

    echo '</ol>';
}
