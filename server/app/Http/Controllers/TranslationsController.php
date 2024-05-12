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

        return $this->response(['error' => (new Translator())->$method($text) ? null : self::ERROR]);
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
}
