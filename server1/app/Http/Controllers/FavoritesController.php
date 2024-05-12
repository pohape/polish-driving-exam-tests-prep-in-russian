<?php

namespace App\Http\Controllers;

use App\FavoritesManager;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoritesController extends BaseController
{
    /**
     * @param Request $request
     * @return array
     * @throws Exception
     */
    private function getFavoritesRegistrationDateAndCheck(Request $request)
    {
        $registrationDate = $request->input('registration_date', null);

        if (!$registrationDate) {
            throw new Exception('Specify "registration_date"');
        }

        return [new FavoritesManager(), $registrationDate];
    }

    /**
     * @param Request $request
     * @param string $method
     * @return JsonResponse
     * @throws Exception
     */
    private function addOrRemove(Request $request, $method = 'add')
    {
        list($favorites, $registrationDate) = $this->getFavoritesRegistrationDateAndCheck($request);
        $questionOrId = $request->input('question_or_id', null);

        if (!$questionOrId) {
            throw new Exception('Specify "question_or_id"');
        }

        return $this->response([
            'error' => $favorites->$method($questionOrId, $registrationDate) ? null : 'it did not work',
            'favorites' => $favorites->getShort($registrationDate)
        ]);
    }

    /**
     * @param Request $request
     * @return JsonResponse
     * @throws Exception
     */
    public function add(Request $request)
    {
        return $this->addOrRemove($request, 'add');
    }

    /**
     * @param Request $request
     * @return JsonResponse
     * @throws Exception
     */
    public function remove(Request $request)
    {
        return $this->addOrRemove($request, 'remove');
    }

    /**
     * @param Request $request
     * @return JsonResponse
     * @throws Exception
     */
    public function getList(Request $request)
    {
        list($favorites, $registrationDate) = $this->getFavoritesRegistrationDateAndCheck($request);

        return $this->response([
            'error' => null,
            'favorites' => $favorites->getShort($registrationDate)
        ]);
    }
}
