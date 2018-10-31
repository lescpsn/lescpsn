<?php

function question_format(array $q) {
    if (!isset($q) && empty($q)) return  false;
    if (count($q) <= 8) return false;
    $q_arr = [
        'title' => $q[0],
        'question_type' => 1,
        'question' => $q[1],
        'is_interesting' => $q[2],
        'teacher_id' => $q[3],
        'images_name' => $q[4],
        'tips' => $q[5],
        'right_key' => s2i($q[6]),
    ];
    $keys = [];
    for ($i = 7;$i < count($q); $i++){
        if (!empty($q[$i]))
            $keys[] = $q[$i];
    }
    $q_arr['keys'] = $keys;
    return $q_arr;
}
// 1|王老师|images王老师.jpg|1|第一人称的评语
function teacher_format(array $q) {
    if (count($q) != 6) return false;
    $q_arr = [
        'teacher_id' => $q[0],
        'name' =>  $q[1],
        'images_name' => $q[2],
        'comment_type' => $q[3],
        'score' => $q[4],
        'comment' => $q[5],
    ];
    return $q_arr;
}

function ob2ar(stdClass $ob) {
    return json_decode(json_encode($ob),TRUE);
}
function s2i(string $s) {
    if (is_numeric($s)) return $s;
    if (!is_string($s)) return FALSE;
    $s_arr = ['a' => 0, 'b' => 1, 'c' => 2, 'd' => 3, 'e' => 4, 'f' => 5, 'g' => 6, 'h' => 7, 'i' => 8, 'j' => 9, 'k' => 10, 'l' => 11, 'm' => 12, 'n' => 13, 'o' => 14, 'p' => 15, 'q' => 16, 'r' => 17, 's' => 18, 't' => 19, 'u' => 20, 'v' => 21, 'w' => 22, 'x' => 23, 'y' => 24, 'z' => 25];
    $_s = strtolower($s);
    return key_exists($_s, $s_arr) ? $s_arr[$_s] : 0;
}