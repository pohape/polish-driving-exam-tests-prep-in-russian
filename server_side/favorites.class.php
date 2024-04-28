<?php

class Favorites extends Base
{
    protected string $filename = '../favorites.json';

    public function saveToFavorites(string $string)
    {
        $favorites = self::load();

        if (!in_array($string, $favorites)) {
            $favorites[] = $string;
            $this->save($favorites);
        }
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
        return self::load();
    }
}
