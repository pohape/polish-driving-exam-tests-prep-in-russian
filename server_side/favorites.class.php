<?php

class Favorites extends Base
{
    protected string $filename = '../favorites.json';

    public function saveToFavorites(string $string): bool
    {
        $favorites = self::load();

        if (array_key_exists($string, $favorites)) {
            return true;
        }

        $questions = self::load('../questions.json');

        if (array_key_exists($string, $questions)) {
            $favorites[$string] = $questions[$string];
            $this->save($favorites);

            return true;
        }

        return false;
    }

    public function removeFromFavorites(string $string)
    {
        $favorites = self::load();

        if (($key = array_search($string, $favorites)) !== false) {
            unset($favorites[$key]);
            $this->save($favorites);
        }
    }

    public function getFavorites()
    {
        return array_keys(self::load());
    }
}
