<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\PingController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PasswordController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\JudgeController;
use App\Http\Controllers\Api\EmployeeController;

/*
|--------------------------------------------------------------------------
| Health / Ping
|--------------------------------------------------------------------------
*/
Route::get('/ping', [PingController::class, 'ping']);

/*
|--------------------------------------------------------------------------
| Auth (Public)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {

    // Login (username أو email)
    Route::post('/login', [AuthController::class, 'login']);

    /*
    |--------------------------------------------------------------------------
    | Forgot Password flow (PUBLIC)
    |--------------------------------------------------------------------------
    */

    // ✅ check username/email → role
    Route::post('/forgot-password/check', [AuthController::class, 'forgotPasswordCheck']);

    // 🔒 send reset link (ADMIN ONLY logic inside controller)
    Route::post('/forgot-password', [PasswordController::class, 'forgot']);

    // 🔒 reset password via token (ADMIN ONLY)
    Route::post('/reset-password', [PasswordController::class, 'reset']);

    /*
    |--------------------------------------------------------------------------
    | Authenticated user
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::patch('/change-password', [AuthController::class, 'changePassword']);
    });
});

/*
|--------------------------------------------------------------------------
| Protected routes (auth:sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Documents
    |--------------------------------------------------------------------------
    */
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::post('/documents', [DocumentController::class, 'store']);
    Route::get('/documents/search', [DocumentController::class, 'search']);
    Route::get('/documents/{id}', [DocumentController::class, 'show']);
    Route::get('/documents/{id}/download', [DocumentController::class, 'download']);
    Route::put('/documents/{id}', [DocumentController::class, 'update']);
    Route::patch('/documents/{id}', [DocumentController::class, 'update']);
    Route::delete('/documents/{id}', [DocumentController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | Judges
    |--------------------------------------------------------------------------
    */
    Route::get('/judges', [JudgeController::class, 'index']);

    /*
    |--------------------------------------------------------------------------
    | Employees (ADMIN ONLY)
    |--------------------------------------------------------------------------
    */
    Route::middleware('admin')->group(function () {

        Route::get('/employees', [EmployeeController::class, 'index']);
        Route::post('/employees', [EmployeeController::class, 'store']);
        Route::get('/employees/{user}', [EmployeeController::class, 'show']);
        Route::match(['put', 'patch'], '/employees/{user}', [EmployeeController::class, 'update']);

        // reset to default 123456 + revoke tokens
        Route::patch('/employees/{user}/password', [EmployeeController::class, 'updatePassword']);

        // toggle active + revoke tokens
        Route::patch('/employees/{user}/toggle-active', [EmployeeController::class, 'toggleActive']);

        Route::delete('/employees/{user}', [EmployeeController::class, 'destroy']);
    });
});
