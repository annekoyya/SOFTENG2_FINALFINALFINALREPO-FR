<?php

namespace App\Http\Controllers;
 
use App\Models\Notification;
// use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
 
class NotificationController extends Controller
{
    // GET /api/notifications  — latest 30 for current user
    public function index(): JsonResponse
    {
        $notifs = Notification::where('user_id', Auth::id())
            ->latest()
            ->limit(30)
            ->get();
 
        return response()->json($notifs);
    }
 
    // POST /api/notifications/{id}/read
    public function markRead(int $id): JsonResponse
    {
        Notification::where('id', $id)->where('user_id', Auth::id())->update(['read' => true]);
        return response()->json(['message' => 'Marked read.']);
    }
 
    // POST /api/notifications/read-all
    public function markAllRead(): JsonResponse
    {
        Notification::where('user_id', Auth::id())->update(['read' => true]);
        return response()->json(['message' => 'All marked read.']);
    }
}
 