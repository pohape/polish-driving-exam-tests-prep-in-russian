<?php

class Favorites extends Base
{
    protected string $filename = '../favorites.json';

    public function saveToFavorites(string $string)
    {
        $favorites = self::load();

        if (!in_array($string, $favorites)) {
            $favorites[] = $string;

            file_put_contents(
                __DIR__ . '/' . $this->filename,
                json_encode($favorites, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            );
        }
    }

    public function getFavorites()
    {
        return self::load();
    }
}
