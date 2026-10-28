<?php

declare(strict_types=1);

/*
 * Routeur du serveur PHP intégré pour l'appli de bureau : un seul serveur sert
 * l'API Symfony sous /api et le front compilé (web/dist, la racine du serveur) partout ailleurs.
 */

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if ('/api' === $path || str_starts_with($path, '/api/')) {
    $_SERVER['SCRIPT_FILENAME'] = dirname(__DIR__).'/api/public/index.php';
    $_SERVER['SCRIPT_NAME'] = $_SERVER['PHP_SELF'] = '/index.php';

    require $_SERVER['SCRIPT_FILENAME'];

    return true;
}

// Un fichier du build (JS, CSS, images) : le serveur intégré l'envoie avec le bon type.
if ('/' !== $path && is_file($_SERVER['DOCUMENT_ROOT'].$path)) {
    return false;
}

// Toute autre adresse (/stats, /…) est une page du front : React Router s'en charge.
header('Content-Type: text/html; charset=utf-8');
readfile($_SERVER['DOCUMENT_ROOT'].'/index.html');

return true;
