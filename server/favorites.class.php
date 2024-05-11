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

    public function add($questionOrId, string $regDate): bool
    {
        return is_numeric($questionOrId)
            ? $this->addById(intval($questionOrId), $regDate)
            : $this->addByQuestionText($questionOrId, $regDate);
    }

    private function addByQuestionText(string $questionText, string $regDate)
    {
        $favorites = $this->load();
        $questions = $this->load($this->questionsFilename);

        if (!array_key_exists($regDate, $favorites)) {
            $favorites[$regDate] = array();
        }

        if (array_key_exists($questionText, $questions)) {
            $favorites[$regDate][$questionText] = $questions[$questionText];
            $this->save($favorites);

            return true;
        }

        return false;
    }

    private function addById(int $questionId, string $regDate): bool
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
            sort($favorites[$regDate][$questionString]);
            $favorites[$regDate][$questionString] = array_values(array_unique($favorites[$regDate][$questionString]));
            $this->save($favorites);

            return true;
        }

        return false;
    }

    public function remove($questionOrId, string $regDate): bool
    {
        return is_numeric($questionOrId)
            ? $this->removeById(intval($questionOrId), $regDate)
            : $this->removeByQuestionText($questionOrId, $regDate);
    }

    private function removeByQuestionText(string $questionText, string $regDate): bool
    {
        $favorites = $this->load();

        if (array_key_exists($regDate, $favorites) && array_key_exists($questionText, $favorites[$regDate])) {
            unset($favorites[$regDate][$questionText]);
            $this->save($favorites);

            return true;
        }

        return false;
    }

    private function removeById(int $questionId, string $regDate): bool
    {
        $favorites = $this->load();

        if (array_key_exists($regDate, $favorites)) {
            foreach ($favorites[$regDate] as $questionText => $idList) {
                $pos = array_search($questionId, $idList);

                if ($pos !== false) {
                    unset($favorites[$regDate][$questionText][$pos]);

                    if (count($favorites[$regDate][$questionText])) {
                        sort($favorites[$regDate][$questionText]);
                        $favorites[$regDate][$questionText] = array_values($favorites[$regDate][$questionText]);
                    } else {
                        unset($favorites[$regDate][$questionText]);
                    }

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
