<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string $role)
    {
        $user = $request->user();
        if (!$user || $user->role !== $role) {
            return response()->json(['message' => 'غير مصرح لك بتنفيذ هذا الإجراء.'], 403);
        }
        return $next($request);
    }
}
