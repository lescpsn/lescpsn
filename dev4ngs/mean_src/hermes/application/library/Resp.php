<?php
class Resp {
    static function success($data) {
        header("Content-type: application/json");
        echo json_encode([
            'code' => 0,
            'info' => 'ok',
            'data' => $data
        ]);
    }
    static function errEnd(string $info) {
        header("Content-type: application/json");
        echo json_encode([
            'code' => 0,
            'info' => $info,
        ]);
        exit;
    }
}