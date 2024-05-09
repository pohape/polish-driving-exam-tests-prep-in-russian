<?php

class Base
{
    protected string $filename = '';

    protected function load(string $filename = null)
    {
        $filename = $filename ?? $this->filename;

        if (empty($filename)) {
            return [];
        }

        $path = __DIR__ . '/' . $filename;

        if (file_exists($path)) {
            return json_decode(file_get_contents($path), true) ?: [];
        } else {
            return [];
        }
    }

    protected function save($data)
    {
        file_put_contents(
            __DIR__ . '/' . $this->filename,
            json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );
    }
}
