<?php
function sendDatas($query,$len){
    global $data;
    $data=array();
    $data['query']=$query;
    for($i=0;$i<$len;$i++){
       $n=$query.$i;
       $data['result'][$i]['word']=$n;
    }
}
sendDatas($_POST['query'],$_POST['pageSize']);     
$arr='sdfsdf';
echo (json_encode($data));