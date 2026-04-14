<?php
// app/Http/Middleware/DisableCsrfForApi.php

namespace App\Http\Middleware;

use Closure;

class DisableCsrfForApi
{
    public function handle($request, Closure $next)
    {
        // Disable CSRF for all API routes
        if ($request->is('api/*')) {
            \Illuminate\Support\Facades\Log::info('CSRF disabled for API route: ' . $request->path());
            return $next($request);
        }
        
        return app()->make(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class)->handle($request, $next);
    }
}