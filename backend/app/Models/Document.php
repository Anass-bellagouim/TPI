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
    'original_filename',
    'file_path',
    'content_text',
    'extract_status',
    'extract_error',
    ];
}
