<?php

declare(strict_types=1);

namespace Tracker;

use PDO;

class Database
{
    private static ?PDO $instance = null;

    public static function connect(): PDO
    {
        if (self::$instance !== null) {
            return self::$instance;
        }

        $home = getenv('HOME') ?: ($_SERVER['HOME'] ?? '/tmp');
        $path = getenv('DB_PATH') ?: $home . '/.sensorario-tracker/tracker.db';

        self::$instance = new PDO('sqlite:' . $path);
        self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        self::$instance->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        // drop completed_at if it still exists in the schema
        $cols = array_column(
            self::$instance->query('PRAGMA table_info(pomodoros)')->fetchAll(),
            'name'
        );
        if (in_array('completed_at', $cols, true)) {
            self::$instance->exec('ALTER TABLE pomodoros DROP COLUMN completed_at');
        }

        return self::$instance;
    }
}