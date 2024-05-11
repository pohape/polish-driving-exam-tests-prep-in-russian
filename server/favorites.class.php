<?php
require_once __DIR__ . '/base.class.php';

class Favorites extends Base
{
    protected string $filename = 'data/favorites.json';
    protected string $questionsFilename = 'data/questions.json';

    protected function save($favorites)
    {
        array_walk($favorites, fn(&$questions) => ksort($questions));
        parent::save($favorites);
    }

    public function saveToFavoritesByString(string $string, string $regDate): bool
    {
        $favorites = $this->load();
        $regDateExists = array_key_exists($regDate, $favorites);

        if ($regDateExists && array_key_exists($string, $favorites[$regDate])) {
            return true;
        }

        $questions = $this->load($this->questionsFilename);

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

    public function saveToFavoritesById(int $questionId, string $regDate): bool
    {
        $favorites = $this->load();
        $questions = $this->load($this->questionsFilename);

        $questionString = null;

        foreach ($questions as $questionString2 => $ids) {
            if (in_array($questionId, $ids)) {
                $questionString = $questionString2;
            }
        }

        if ($questionString) {
            if (!array_key_exists($regDate, $favorites)) {
                $favorites[$regDate] = array();
            }

            if (!array_key_exists($questionString, $favorites[$regDate])) {
                $favorites[$regDate][$questionString] = array();
            }

            $favorites[$regDate][$questionString][] = $questionId;
            $favorites[$regDate][$questionString] = array_values(array_unique($favorites[$regDate][$questionString]));
            $this->save($favorites);

            return true;
        }

        return false;
    }

    public function removeFromFavoritesByString(string $string, string $regDate): bool
    {
        $favorites = $this->load();

        if (array_key_exists($regDate, $favorites) && array_key_exists($string, $favorites[$regDate])) {
            unset($favorites[$regDate][$string]);
            $this->save($favorites);

            return true;
        }

        return false;
    }

    public function removeFromFavoritesById(int $questionId, string $regDate): bool
    {
        $favorites = $this->load();

        if (array_key_exists($regDate, $favorites)) {
            foreach ($favorites[$regDate] as $idList) {
                $pos = array_search($questionId, $idList);

                if ($pos !== false) {
                    unset($favorites[$regDate][$pos]);
                    $favorites[$regDate] = array_values($favorites[$regDate]);
                    $this->save($favorites);

                    return true;
                }
            }
        }

        return false;
    }

    public function getFavoritesShort($regDate)
    {
        return array_keys($this->getFavoritesFull($regDate));
    }

    public function getFavoritesFull($regDate)
    {
        $regDate = stripos($regDate, ' ') ? $regDate : urldecode($regDate);
        $favorites = $this->load();

        return array_key_exists($regDate, $favorites) ? $favorites[$regDate] : [];
    }
}
