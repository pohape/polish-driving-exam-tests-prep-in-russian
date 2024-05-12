<?php

namespace App;

class Base
{
    protected string $filename = '';
    protected $storagePath;

    public function __construct()
    {
        $this->storagePath = app()->storagePath();
    }

    protected function load(string $filename = null)
    {
        $filename = $filename ?? $this->filename;

        if (empty($filename)) {
            return [];
        }

        $path = $this->storagePath . '/' . $filename;

        if (file_exists($path)) {
            return json_decode(file_get_contents($path), true) ?: [];
        } else {
            return [];
        }
    }

    protected function save($data): bool
    {
        $res = (bool)file_put_contents(
            $this->storagePath . '/' . $this->filename,
            json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );

        return $res;
    }
}
