<?php

/** @var \Laravel\Lumen\Routing\Router $router */

$router->get('/', function () use ($router) {
    return redirect()->to('https://github.com/pohape/polish-driving-exam-tests-prep-in-russian/');
});

$router->post('favorites/get', 'FavoritesController@getList');
