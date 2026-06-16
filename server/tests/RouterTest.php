<?php

declare(strict_types=1);

namespace Tracker\Tests;

use PHPUnit\Framework\TestCase;
use Tracker\Router;

class RouterTest extends TestCase
{
    public function testRootRouteReturnsOk(): void
    {
        $router = new Router();
        $router->get('/', fn() => ['message' => 'Tracker API', 'version' => '1.0.0']);

        $response = $router->dispatch('GET', '/');

        $this->assertSame(200, $response['status']);
        $this->assertSame('Tracker API', $response['body']['message']);
    }

    public function testUnknownRouteReturnsNotFound(): void
    {
        $router = new Router();

        $response = $router->dispatch('GET', '/unknown');

        $this->assertSame(404, $response['status']);
    }
}