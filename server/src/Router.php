<?php

declare(strict_types=1);

namespace Tracker;

class Router
{
    private array $routes = [];

    public function get(string $path, callable $handler): void
    {
        $this->routes['GET'][$path] = $handler;
    }

    public function post(string $path, callable $handler): void
    {
        $this->routes['POST'][$path] = $handler;
    }

    public function patch(string $path, callable $handler): void
    {
        $this->routes['PATCH'][$path] = $handler;
    }

    public function dispatch(string $method, string $path): array
    {
        $handler = $this->routes[$method][$path] ?? null;
        $params = [];

        if ($handler === null) {
            foreach ($this->routes[$method] ?? [] as $route => $h) {
                $pattern = '#^' . preg_replace('/:([^\/]+)/', '([^/]+)', $route) . '$#';
                if (preg_match($pattern, $path, $matches)) {
                    preg_match_all('/:([^\/]+)/', $route, $names);
                    foreach ($names[1] as $i => $name) {
                        $params[$name] = $matches[$i + 1];
                    }
                    $handler = $h;
                    break;
                }
            }
        }

        if ($handler === null) {
            return ['status' => 404, 'body' => ['error' => 'Not Found']];
        }

        $result = $handler($params);

        // handler may return a full ['status'=>X,'body'=>Y] response
        if (array_key_exists('status', $result) && array_key_exists('body', $result)) {
            return $result;
        }

        return ['status' => 200, 'body' => $result];
    }
}