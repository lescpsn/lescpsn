<?php
/**
 * Created by PhpStorm.
 * User: Jack
 * Date: 2016/5/18
 * Time: 10:54
 */
use MongoDB\Client;
use MongoDB;

class AcController extends Yaf_Controller_Abstract {
    public $model;
    public $mongodb_client;
    public $host = "http://api.childhood.tusoapp.com";
    function init() {
        $this->mongodb_client = new Client('mongodb://' . Yaf_Application::app()->getConfig()->mongo->db_user . ':' .Yaf_Application::app()->getConfig()->mongo->db_pass . '@' . Yaf_Application::app()->getConfig()->mongo->host . ":" . Yaf_Application::app()->getConfig()->mongo->port . '/' . Yaf_Application::app()->getConfig()->mongo->db_name ,[] ,['typeMap' => ['root' => 'array', 'document' => 'array', 'array' => 'array']]);
        $this->model =  $this->mongodb_client->selectCollection(Yaf_Application::app()->getConfig()->mongo->db_name,'active_qa');
        $this->t_model =  $this->mongodb_client->selectCollection(Yaf_Application::app()->getConfig()->mongo->db_name,'active_qa_t');
        $this->n_model =   $this->mongodb_client->selectCollection(Yaf_Application::app()->getConfig()->mongo->db_name,'active_qa_auto');
        Yaf_Dispatcher::getInstance()->disableView();
    }

    // q_list 输出题目
    public function q_listAction() {
        $totle = $this->get_nowId('question');
        $ids = [];
        for ($i=0;$i<15;$i++) {
            $ids[] = rand(0, $totle);
        }
        $collects = $this->model->find(['_id' => ['$in' => $ids]])->toArray();
        foreach ($collects as $key => $val) {
            $collects[$key]['images_url'] =  Yaf_Application::app()->getConfig()->qiniu->bucket_url . '/61_q/' . $val['images_name'];
            unset($collects[$key]['right_key']);
            unset($collects[$key]['images_name']);
            unset($collects[$key]['question_type']);
            unset($collects[$key]['is_interesting']);
            unset($collects[$key]['teacher_id']);
            unset($collects[$key]['id']);
        }
        Resp::success($collects);
    }

    public function delete_qAction() {
        $this->model->drop();
    }

    // q_check 题目的正确性检测
    public function q_checkAction() {
        $req = file_get_contents("php://input");
        if (empty($req))
            Resp::errEnd("Param empty");
        $req_arr = json_decode($req, true);
        if (empty($req_arr))
            Resp::errEnd("Param empty");
        $ids = [];
        foreach ($req_arr as $k => $v) {
            $ids[] = $v['_id'];
        }
        $q_list =  $this->model->find(['_id' => ['$in' => $ids]])->toArray();
        $right = 0;
        $err = 0;
        $teacher_id = 0;
        foreach($q_list as $k => $v) {
            if (!empty($v['teacher_id']) && $teacher_id == 0) {
                $teacher_id = intval($v['teacher_id']);
            }
            foreach ($req_arr as $kk => $vv) {
                if ($vv['_id'] == $v['_id']) {
                    if ($v['right_key'] === $vv['key']) {
                        $right += 1;
                    } else {
                        $err += 1;
                    }
                }
            }
        }
        $teacher  = null;
        //处理是否有老师
        if (!empty($teacher_id)) {
            $teacher = $this->t_model->findOne(['_id' => $teacher_id]);
            $data['teacher_id'] = $teacher_id;
            $data['teacher'] = $teacher;
        }
        $data['right'] = $right;
        $data['comment'] = "默认评论";
        $data['err'] = $err;
        Resp::success($data);
    }

    // q_info 单条题目的详细信息
    public function q_info() {

    }

    // post_q 添加题库
    public function post_qAction() {
        $this->model->drop();
        $this->reset_Id('question');

        if (!isset($_FILES["file"]["tmp_name"]) && is_file($_FILES["file"]["tmp_name"])) die('no file');
        $f = file_get_contents($_FILES["file"]["tmp_name"]);
        $f = str_replace("\r",'',$f);
        $ql = explode("\n", $f);
        $qiniu_up = '';
        for ($i = 0; $i < count($ql); $i ++) {
            $eacho_q = explode("|", $ql[$i]);
            $e = &question_format($eacho_q);
            if ($e == false) continue;
            $e['_id'] = $this->get_nextId('question');
            $this->model->insertOne($e);
            $qiniu_up .= $this->host . '/61_q/' . $e['images_name'] . "\n";
        }
        file_put_contents("qiniu_up_q", $qiniu_up);
        $data['question'] = $totle = $this->get_nowId('question');
        $data['teacher'] = $totle = $this->get_nowId('teacher');
        Resp::success($data);
    }

    public function post_tAction() {
        $this->t_model->drop();
        $this->reset_Id('teacher');
        if (!isset($_FILES["file"]["tmp_name"]) && is_file($_FILES["file"]["tmp_name"])) die('no file');
        $f = file_get_contents($_FILES["file"]["tmp_name"]);
        $f = str_replace("\r",'',$f);
        $ql = explode("\n", $f);
        $qiniu_up = '';
        for ($i = 0; $i < count($ql); $i ++) {
            $eacho_q = explode("|", $ql[$i]);
            $e = &teacher_format($eacho_q);
            if ($e == false) continue;
            $e['_id'] = $this->get_nextId('teacher');
            $this->t_model->insertOne($e);
            $qiniu_up .= $this->host . '/61_t/' . $e['images_name'] . "\n";
        }
        file_put_contents("qiniu_up_t", $qiniu_up);
        $data['question'] = $totle = $this->get_nowId('question');
        $data['teacher'] = $totle = $this->get_nowId('teacher');
        Resp::success($data);
    }

    private function get_nextId($key) {
        $resp = $this->n_model->findOneAndUpdate([],[
            '$inc' => [$key.'_id' => 1],
        ] , [
            'upsert' => true,
        ]);
        $resp = ob2ar($resp);
        if (empty($resp)){
            $id = 0;
        } else {
            $id =  $resp[$key . '_id'];
        }
        return $id;
    }
    private function get_nowId($key) {
        $resp = $this->n_model->findOne([$key.'_id' => ['$gt' => -1]]);
        if (empty($resp)){
            $id = 0;
        } else {
            $id =  $resp[$key . '_id'];
        }
        return $id;
    }
    private function reset_Id($key) {
        $this->n_model->findOneAndUpdate([],[
            '$set' => [$key . '_id' => 0]
        ] , [
            'upsert' => true,
        ]);
    }
    // get_qs 获取题库
    public function get_qs() {

    }
    // put_q 更新某条题目
    public function put_q() {

    }
}