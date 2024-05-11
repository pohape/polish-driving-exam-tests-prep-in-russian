<?php
require_once __DIR__ . '/base.class.php';

class Favorites extends Base
{
    protected string $filename = 'data/favorites.json';
    protected string $questionsFilename = 'data/questions.json';

    protected function save($favorites): bool
    {
        array_walk($favorites, fn(&$questions) => ksort($questions));

        return parent::save($favorites);
    }

    public function add($questionOrId, string $regDate): bool
    {
        $favorites = $this->load();
        $questions = $this->load($this->questionsFilename);

        return is_numeric($questionOrId)
            ? $this->addById(intval($questionOrId), $regDate, $favorites, $questions)
            : $this->addByQuestionText($questionOrId, $regDate, $favorites, $questions);
    }

    private function addByQuestionText(string $questionText, string $regDate, array &$favorites, array $questions)
    {
        $favorites[$regDate] = $favorites[$regDate] ?? [];

        if (array_key_exists($questionText, $questions)) {
            $favorites[$regDate][$questionText] = $questions[$questionText];

            return $this->save($favorites);
        }

        return false;
    }

    private function addById(int $questionId, string $regDate, array &$favorites, array $questions): bool
    {
        $questionString = null;

        foreach ($questions as $questionString2 => $ids) {
            if (in_array($questionId, $ids)) {
                $questionString = $questionString2;
                break;
            }
        }

        if ($questionString) {
            $favorites[$regDate] = $favorites[$regDate] ?? [];
            $favorites[$regDate][$questionString] = $favorites[$regDate][$questionString] ?? [];
            $favorites[$regDate][$questionString][] = $questionId;
            $favorites[$regDate][$questionString] = array_values(array_unique($favorites[$regDate][$questionString]));
            sort($favorites[$regDate][$questionString]);

            return $this->save($favorites);
        }

        return false;
    }

    public function remove($questionOrId, string $regDate): bool
    {
        $favorites = $this->load();

        return is_numeric($questionOrId)
            ? $this->removeById(intval($questionOrId), $regDate, $favorites)
            : $this->removeByQuestionText($questionOrId, $regDate, $favorites);
    }

    private function removeByQuestionText(string $questionText, string $regDate, array $favorites): bool
    {
        if (isset($favorites[$regDate][$questionText])) {
            unset($favorites[$regDate][$questionText]);

            return $this->cleanupAndSave($favorites, $regDate);
        }

        return false;
    }

    private function removeById(int $questionId, string $regDate, array $favorites): bool
    {
        if (isset($favorites[$regDate])) {
            foreach ($favorites[$regDate] as $questionText => &$idList) {
                if (($pos = array_search($questionId, $idList)) !== false) {
                    unset($idList[$pos]);

                    if (empty($idList)) {
                        unset($favorites[$regDate][$questionText]);
                    } else {
                        $idList = array_values($idList);
                    }

                    return $this->cleanupAndSave($favorites, $regDate);
                }
            }
        }

        return false;
    }

    private function cleanupAndSave(array &$favorites, string $regDate): bool
    {
        if (empty($favorites[$regDate])) {
            unset($favorites[$regDate]);
        }

        return $this->save($favorites);
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
