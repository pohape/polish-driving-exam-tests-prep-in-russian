<?php

namespace App\Http\Controllers;

use App\FavoritesManager;
use Illuminate\Http\Request;
use Laravel\Lumen\Routing\Controller;

class FavoritesController extends Controller
{
    public function getList(Request $request)
    {
        $registrationDate = $request->input('registration_date', null);

        if (!$registrationDate) {
            return response()->json(['error' => 'Specify "registration_date"']);
        }

        $favorites = new FavoritesManager();

        return response()->json([
            'error' => null,
            'favorites' => $favorites->getShort($registrationDate)
        ], 200, [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
}
