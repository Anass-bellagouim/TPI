<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DocumentController;

// 🔎 search خاصها تكون قبل {id}
Route::get('/documents/search', [DocumentController::class, 'search']);

Route::post('/documents', [DocumentController::class, 'store']);
Route::get('/documents', [DocumentController::class, 'index']);

// 📄 document واحد
Route::get('/documents/{id}', [DocumentController::class, 'show']);

// ⬇️ تحميل PDF
Route::get('/documents/{id}/download', [DocumentController::class, 'download']);

// ✏️ تعديل
Route::put('/documents/{id}', [DocumentController::class, 'update']);
Route::patch('/documents/{id}', [DocumentController::class, 'update']);

// 🗑️ حذف
Route::delete('/documents/{id}', [DocumentController::class, 'destroy']);

// 🧪 test
Route::get('/ping', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'API routes working'
    ]);
});
