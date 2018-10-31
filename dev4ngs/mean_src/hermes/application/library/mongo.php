<?php
use MongoDB\Client;

class PHPMongo {
    function __construct()
    {
        if ($GLOBALS['mongodb'] == null || !is_object($GLOBALS['mongodb'])){
            $GLOBALS['mongodb'] = new MongoDB\Client('mongodb://192.168.1.117:27017');
        }
        return $GLOBALS['mongodb'];
    }
}