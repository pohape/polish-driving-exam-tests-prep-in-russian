<?php

/** @var \Laravel\Lumen\Routing\Router $router */

$router->get('/', function () use ($router) {
    return redirect()->to('https://github.com/pohape/polish-driving-exam-tests-prep-in-russian/');
});

$router->get('favorites', 'FavoritesController@showList');
$router->post('favorites/get', 'FavoritesController@getShort');
$router->post('favorites/getFull', 'FavoritesController@getFull');
$router->post('favorites/add', 'FavoritesController@add');
$router->post('favorites/remove', 'FavoritesController@remove');
$router->post('translations/get', 'TranslationsController@getTranslation');
$router->post('translations/markCorrect', 'TranslationsController@markCorrect');
$router->post('translations/markIncorrect', 'TranslationsController@markIncorrect');
