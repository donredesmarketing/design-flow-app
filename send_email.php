<?php
// Script básico para enviar correos desde Hostinger
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!$data) {
        echo json_encode(["status" => "error", "message" => "Sin datos"]);
        exit;
    }

    $to = $data['clientEmail'];
    $subject = "Nueva Actualización de Diseño";
    $message = "Hola,\n\nHay novedades en tu proyecto: " . $data['projectTitle'] . "\n\n" . $data['description'];
    $headers = "From: no-reply@" . $_SERVER['HTTP_HOST'];

    // Enviar al cliente
    mail($to, $subject, $message, $headers);
    // Enviar copia al admin
    mail($data['adminEmail'], "Copia: " . $subject, $message, $headers);

    echo json_encode(["status" => "success"]);
}