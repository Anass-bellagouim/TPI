<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $fillable = [
        'user_id',
        'actor_name',
        'action',
        'entity_type',
        'entity_id',
        'message',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
