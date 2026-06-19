<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use Tracker\Database;
use Tracker\Router;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$db = Database::connect();
$router = new Router();

$router->get('/', fn() => ['message' => 'Tracker API', 'version' => '1.0.0']);

$router->get('/timeboxes', function () use ($db): array {
    return $db
        ->query('SELECT id, started_at, description FROM timeboxes ORDER BY started_at DESC')
        ->fetchAll();
});

$router->post('/timeboxes', function () use ($db): array {
    $last = $db
        ->query('SELECT started_at FROM timeboxes ORDER BY started_at DESC LIMIT 1')
        ->fetch();

    if ($last) {
        $elapsed = time() - (new \DateTimeImmutable($last['started_at']))->getTimestamp();
        if ($elapsed < 25 * 60) {
            return ['status' => 409, 'body' => [
                'error' => 'Too early',
                'seconds_remaining' => 25 * 60 - $elapsed,
            ]];
        }
    }

    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $startedAt = (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->format('Y-m-d\TH:i:s\Z');
    $description = trim($body['description'] ?? '');

    $stmt = $db->prepare('INSERT INTO timeboxes (started_at, description) VALUES (?, ?)');
    $stmt->execute([$startedAt, $description]);

    return ['status' => 201, 'body' => [
        'id'          => (int) $db->lastInsertId(),
        'started_at'  => $startedAt,
        'description' => $description,
    ]];
});

$router->patch('/timeboxes/:id', function (array $params) use ($db): array {
    $id = (int) $params['id'];
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $description = trim($body['description'] ?? '');

    $stmt = $db->prepare('UPDATE timeboxes SET description = ? WHERE id = ?');
    $stmt->execute([$description, $id]);

    if ($stmt->rowCount() === 0) {
        return ['status' => 404, 'body' => ['error' => 'Not Found']];
    }

    return ['status' => 200, 'body' => ['id' => $id, 'description' => $description]];
});

$method = $_SERVER['REQUEST_METHOD'];
$path   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

$response = $router->dispatch($method, $path);
http_response_code($response['status']);
echo json_encode($response['body']);