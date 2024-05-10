<?php
require_once __DIR__ . '/base.class.php';

class Favorites extends Base
{
    protected string $filename = '../favorites.json';

    public function saveToFavorites(string $string, string $regDate): bool
    {
        $favorites = $this->load();
        $regDateExists = array_key_exists($regDate, $favorites);

        if ($regDateExists && array_key_exists($string, $favorites[$regDate])) {
            return true;
        }

        $questions = $this->load('../questions.json');

        if (array_key_exists($string, $questions)) {
            if (!$regDateExists) {
                $favorites[$regDate] = array();
            }

            $favorites[$regDate][$string] = $questions[$string];
            $this->save($favorites);

            return true;
        }

        return false;
    }

    public function removeFromFavorites(string $string, string $regDate): bool
    {
        $favorites = $this->load();

        if (array_key_exists($regDate, $favorites) && array_key_exists($string, $favorites[$regDate])) {
            unset($favorites[$regDate][$string]);
            $this->save($favorites);

            return true;
        }

        return false;
    }

    public function getFavoritesShort($regDate)
    {
        $favorites = $this->load();

        return array_key_exists($regDate, $favorites) ? array_keys($favorites[$regDate]) : [];
    }

    public function getFavoritesFull($regDate)
    {
        $favorites = $this->load();

        return array_key_exists($regDate, $favorites) ? $favorites[$regDate] : [];
    }
}
