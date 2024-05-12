<?php

/** @var \Laravel\Lumen\Routing\Router $router */

$router->get('/', function () use ($router) {
    return redirect()->to('https://github.com/pohape/polish-driving-exam-tests-prep-in-russian/');
});

$router->post('favorites/get', 'FavoritesController@getList');
$router->post('favorites/add', 'FavoritesController@add');
$router->post('favorites/remove', 'FavoritesController@remove');
$router->post('translations/get', 'TranslationsController@getTranslation');
