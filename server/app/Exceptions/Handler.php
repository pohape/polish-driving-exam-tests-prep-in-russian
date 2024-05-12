<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;
use Laravel\Lumen\Exceptions\Handler as ExceptionHandler;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that should not be reported.
     *
     * @var array
     */
    protected $dontReport = [
        AuthorizationException::class,
        HttpException::class,
        ModelNotFoundException::class,
        ValidationException::class,
    ];

    /**
     * Report or log an exception.
     *
     * This is a great spot to send exceptions to Sentry, Bugsnag, etc.
     *
     * @param Throwable $exception
     * @return void
     *
     * @throws Exception
     */
    public function report(Throwable $exception)
    {
        parent::report($exception);
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param Request $request
     * @param Throwable $exception
     * @return Response|JsonResponse
     * @throws Throwable
     * @noinspection PhpMissingParamTypeInspection
     */
    public function render($request, Throwable $exception)
    {
        if ($exception instanceof NotFoundHttpException) {
            return response()->json([
                'error' => 'Not found',
            ], 404);
        }

        $formattedTrace = [];

        foreach ($exception->getTrace() as $entry) {
            $formattedTrace[] = [
                'file' => isset($entry['file']) ? basename($entry['file']) : 'N/A',
                'line' => isset($entry['line']) ? $entry['line'] : 'N/A',
                'function' => isset($entry['function']) ? $entry['function'] : 'N/A',
                'class' => isset($entry['class']) ? $entry['class'] : 'N/A',
            ];
        }

        return response()->json([
            'error' => $exception->getMessage(),
            'type' => get_class($exception),
            'stack_trace' => $formattedTrace
        ], 500, [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
}
