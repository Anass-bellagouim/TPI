<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'type',
        'judgement_number',
        'case_number',
        'judge_name',
        'judge_id',
        'original_filename',
        'file_path',
        'content_text',
        'status',
        'extract_status',
        'extract_error',
        'division',
        'case_type_id',
        'user_id',
        'keyword',
    ];



    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function judge()
    {
        return $this->belongsTo(Judge::class);
    }

    public function caseType()
    {
        return $this->belongsTo(CaseType::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
