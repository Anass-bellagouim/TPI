<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $fillable = [
        'employee_id',
        'actor_name',
        'action',
        'entity_type',
        'entity_id',
        'message',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
