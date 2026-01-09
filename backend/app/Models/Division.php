<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Division extends Model
{
    protected $fillable = ['name', 'is_active', 'sort_order'];

    public function caseTypes()
    {
        return $this->hasMany(CaseType::class);
    }
}
