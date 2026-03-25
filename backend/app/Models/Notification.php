<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
 
class Notification extends Model
{
    protected $fillable = ['user_id','type','title','body','link','read'];
    protected $casts    = ['read' => 'boolean'];
 
    public function user() { return $this->belongsTo(User::class); }
    public function scopeUnread($q) { return $q->where('read', false); }
}