<?php

class Base
{
    /**
     * @var string
     */
    protected string $filename = '';

    protected function load()
    {
        var_dump($this->filename);

        if (empty($this->filename)) {
            return [];
        }

        $path = __DIR__ . '/' . $this->filename;
        var_dump($path);

        if (file_exists($path)) {
            return json_decode(file_get_contents($path), true);
        } else {
            return [];
        }
    }
}
