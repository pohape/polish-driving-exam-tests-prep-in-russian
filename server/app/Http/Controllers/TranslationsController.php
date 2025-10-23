<?php

namespace App\Http\Controllers;

use App\Translator;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TranslationsController extends BaseController
{
    private static function prepareText(string $text)
    {
        if (preg_match('/^([0-9A-F]\.\s)(.*)$/', $text, $matches)) {
            $prefix = $matches[1];
            $text = trim($matches[2]);
        } else {
            $prefix = '';
            $text = trim($text);
        }

        return ['text' => $text, 'prefix' => $prefix];
    }

    /**
     * @param Request $request
     * @return JsonResponse
     * @throws Exception
     */
    public function getTranslation(Request $request)
    {
        $text = $request->input('text', null);

        if (!$text) {
            throw new Exception('Specify "text"');
        }

        $translator = new Translator();
        $prepared = self::prepareText($text);
        $result = $translator->performTranslation($prepared['text']);

        if ($result['translation']) {
            $result['translation'] = $prepared['prefix'] . $result['translation'];
        }

        return $this->response($result);
    }

    /**
     * @param Request $request
     * @param string $method
     * @return JsonResponse
     * @throws Exception
     */
    private function mark(Request $request, string $method = 'markCorrect')
    {
        $text = $request->input('text', null);

        if (!$text) {
            throw new Exception('Specify "text"');
        }

        $prepared = self::prepareText($text);

        return $this->response(['error' => (new Translator())->$method($prepared['text']) ? null : self::ERROR]);
    }

    /**
     * @param Request $request
     * @return JsonResponse
     * @throws Exception
     */
    public function markCorrect(Request $request)
    {
        return $this->mark($request, 'markCorrect');
    }

    /**
     * @param Request $request
     * @return JsonResponse
     * @throws Exception
     */
    public function markIncorrect(Request $request)
    {
        return $this->mark($request, 'markIncorrect');
    }

    /**
     * GET /translations/stats
     */
    public function getTranslationStats(Request $request): JsonResponse
    {
        $translator = new \App\Translator();
        $stats = $translator->getStats();

        // Last commit time (best-effort; may be unavailable in container)
        $gitCommand = 'cd ' . __DIR__ . '; /usr/bin/git log -1 --format=%ct';
        $lastCommitTimestamp = trim((string) shell_exec($gitCommand));

        if (is_numeric($lastCommitTimestamp)) {
            $timeSince = time() - (int) $lastCommitTimestamp;

            $stats['last_commit'] = [
                'timestamp' => (int) $lastCommitTimestamp,
                'seconds_ago' => $timeSince,
                'human' => $this->humanTimeDiff($timeSince),
            ];
        } else {
            $stats['last_commit'] = 'Could not determine last commit time';
        }

        return $this->response($stats);
    }

    // Human-friendly time diff
    private function humanTimeDiff(int $seconds): string
    {
        if ($seconds < 60) {
            return "$seconds seconds ago";
        } elseif ($seconds < 3600) {
            return floor($seconds / 60) . " minutes ago";
        } elseif ($seconds < 86400) {
            return floor($seconds / 3600) . " hours ago";
        } else {
            return floor($seconds / 86400) . " days ago";
        }
    }
}
