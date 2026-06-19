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

        // rename legacy table
        $tables = array_column(
            self::$instance->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(),
            'name'
        );
        if (in_array('pomodoros', $tables, true) && !in_array('timeboxes', $tables, true)) {
            self::$instance->exec('ALTER TABLE pomodoros RENAME TO timeboxes');
        }

        // drop completed_at if it still exists in the schema
        $cols = array_column(
            self::$instance->query('PRAGMA table_info(timeboxes)')->fetchAll(),
            'name'
        );
        if (in_array('completed_at', $cols, true)) {
            self::$instance->exec('ALTER TABLE timeboxes DROP COLUMN completed_at');
        }

        return self::$instance;
    }
}