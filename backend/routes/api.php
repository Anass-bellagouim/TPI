<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\PingController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PasswordController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\JudgeController;
use App\Http\Controllers\Api\EmployeeController;

// ✅ Lookups (read-only)
use App\Http\Controllers\Api\LookupsController;

// ✅ Admin CRUD
use App\Http\Controllers\Api\Admin\DivisionAdminController;
use App\Http\Controllers\Api\Admin\CaseTypeAdminController;
use App\Http\Controllers\Api\Admin\JudgeAdminController;

// ✅ Dashboard (NEW)
use App\Http\Controllers\Api\Admin\DashboardController;

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

    // Login (empname أو email)
    Route::post('/login', [AuthController::class, 'login']);

    // ✅ check empname/email → role
    Route::post('/forgot-password/check', [AuthController::class, 'forgotPasswordCheck']);

    // 🔒 send reset link (ADMIN ONLY logic inside controller)
    Route::post('/forgot-password', [PasswordController::class, 'forgot']);

    // 🔒 reset password via token (ADMIN ONLY)
    Route::post('/reset-password', [PasswordController::class, 'reset']);

    // Authenticated user
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
    Route::get('/documents/judgement-missing', [DocumentController::class, 'judgementMissing']);
    Route::get('/documents/judgement-years', [DocumentController::class, 'judgementYears']);
    Route::get('/documents/{id}', [DocumentController::class, 'show']);
    Route::get('/documents/{id}/download', [DocumentController::class, 'download']);
    Route::match(['put', 'patch'], '/documents/{id}', [DocumentController::class, 'update']);
    Route::delete('/documents/{id}', [DocumentController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | Judges (Legacy / backward-compatible)
    |--------------------------------------------------------------------------
    */
    Route::get('/judges', [JudgeController::class, 'index']);

    /*
    |--------------------------------------------------------------------------
    | ✅ Lookups (Read-only) - for dropdowns/autocomplete
    |--------------------------------------------------------------------------
    */
    Route::prefix('lookups')->group(function () {
        Route::get('/divisions', [LookupsController::class, 'divisions']);
        Route::get('/case-types', [LookupsController::class, 'caseTypes']);
        Route::get('/judges', [LookupsController::class, 'judges']);
    });

    /*
    |--------------------------------------------------------------------------
    | ✅ Admin Area (admin middleware)
    |--------------------------------------------------------------------------
    */
    Route::prefix('admin')->middleware('admin')->group(function () {

        // ✅ Dashboard (NEW)
        Route::get('/dashboard', [DashboardController::class, 'index']);

        // ✅ Divisions CRUD
        Route::get('/divisions', [DivisionAdminController::class, 'index']);
        Route::post('/divisions', [DivisionAdminController::class, 'store']);
        Route::patch('/divisions/{division}', [DivisionAdminController::class, 'update']);
        Route::delete('/divisions/{division}', [DivisionAdminController::class, 'destroy']);

        // ✅ Case Types CRUD
        Route::get('/case-types', [CaseTypeAdminController::class, 'index']);
        Route::post('/case-types', [CaseTypeAdminController::class, 'store']);
        Route::patch('/case-types/{caseType}', [CaseTypeAdminController::class, 'update']);
        Route::delete('/case-types/{caseType}', [CaseTypeAdminController::class, 'destroy']);

        // ✅ Judges CRUD
        Route::get('/judges', [JudgeAdminController::class, 'index']);
        Route::post('/judges', [JudgeAdminController::class, 'store']);
        Route::patch('/judges/{judge}', [JudgeAdminController::class, 'update']);
        Route::delete('/judges/{judge}', [JudgeAdminController::class, 'destroy']);

        // ✅ Employees (admin)
        Route::get('/employees', [EmployeeController::class, 'index']);
        Route::post('/employees', [EmployeeController::class, 'store']);
        Route::get('/employees/{user}', [EmployeeController::class, 'show']);
        Route::match(['put', 'patch'], '/employees/{user}', [EmployeeController::class, 'update']);
        Route::patch('/employees/{user}/password', [EmployeeController::class, 'resetPassword']);
        Route::patch('/employees/{user}/toggle-active', [EmployeeController::class, 'toggleActive']);
        Route::delete('/employees/{user}', [EmployeeController::class, 'destroy']);
    });
});
