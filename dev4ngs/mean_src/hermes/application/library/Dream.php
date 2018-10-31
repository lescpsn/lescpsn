<?php
use Hprose\Http;

class Dream {
    static function regist($url)
    {
        if ($GLOBALS['Hprose'] == null || !is_object($GLOBALS['Hprose'])){
            $GLOBALS['Hprose'] =  new Hprose\Http\Client($url);
        }
        return $GLOBALS['Hprose'];
    }
    static function NewNullInt(int $r, bool $v = false) {
        return ['int64' => $r, 'valid' => $v];
    }
    static function NewNullBool(bool $r, bool $v = false) {
        return ['bool' => $r, 'valid' => $v];
    }
    static function NewNullString(string $r, bool $v = false) {
        return ['string' => $r, 'valid' => $v];
    }
    static function registUser() {
        
    }
}