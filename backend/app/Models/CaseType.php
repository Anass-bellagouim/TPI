<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaseType extends Model
{
    protected $fillable = ['division_id', 'code', 'name', 'is_active', 'sort_order'];

    public function division()
    {
        return $this->belongsTo(Division::class);
    }
}
