apiready = function(){
    /*var frameWidth = api.frameWidth || 0;//获取子窗口宽度
    var frameHeight = api.frameHeight || 0;//获取子窗口高度
    var game_div = $api.dom('.game_div');
    game_div.style.height = frameHeight+'px';
    var can_width = parseInt(frameWidth * 0.8);
    var can_height = can_width;

    var c=document.getElementById("game_box");
    c.width = can_width;
    c.height = can_height;
    var ctx=c.getContext("2d");

    ctx.fillStyle="#FF0000";

    var small_box_l = (can_height - 20) / 4;
    var write_y = 0;//渲染的列
    var write_x = 0; //渲染的行
    var start_x,start_y;//起始点坐标
    for (var i=0; i<16; i++){
        console.log(i);
        start_x = write_x * small_box_l + 4*(write_x + 1);
        start_y = write_y * small_box_l + 4*(write_y + 1);
        ctx.fillRect(start_x,start_y,small_box_l,small_box_l);
        ++write_y;

        if (write_y > 3){
            ++write_x;
            if (write_x > 3) break;
            write_y = 0;
        }
    }*/

    var mainObj = new main();
    mainObj.init();
};

var main = function () {
    var maThis;
};

main.prototype = {
    init:function () {
        maThis = this;
        maThis.frameWidth = api.frameWidth || 0;//获取子窗口宽度
        maThis.frameHeight = api.frameHeight || 0;//获取子窗口高度
        maThis.can_width = parseInt(maThis.frameWidth * 0.8);//画布宽度
        maThis.can_height = maThis.can_width;//画布高度
        maThis.viewTwo = 0.8;//出现2的概率 ps:除了2以外 其余都为4
        maThis.init_num = 3;//初始数字个数
        maThis.down_position = {};//记录用户按下的时间
        maThis.up_position = {};//记录用户放开位置
        maThis.empty_key = new Array();//记录空的数据key
        maThis.clickScore = 0;//记录点击分数的时间,用于判断双击
        maThis.score =0;//记录分数
        maThis.high_score =0;//记录最高分数
        maThis.is_change =0;//是否有变动,没有变动则不能生成新数字
        maThis.ctx = '';//画布对象
        maThis.boxdata = {};//滑块数据存储
        maThis.numType = {//设置数字颜色大小
            0:{'color':'#FFFFCC','size':'30px Arial','correct':9},//空白
            1:{'color':'#FFFF99','size':'30px Arial','correct':9},//2
            2:{'color':'#FF9900','size':'30px Arial','correct':9},//4
            3:{'color':'#FF6600','size':'30px Arial','correct':9},//8
            4:{'color':'#CCFF66','size':'30px Arial','correct':9},//16
            5:{'color':'#CCCC33','size':'30px Arial','correct':9},//32
            6:{'color':'#99CC33','size':'30px Arial','correct':9},//64
            7:{'color':'#66CCFF','size':'30px Arial','correct':9},//128
            8:{'color':'#0099CC','size':'30px Arial','correct':9},//256
            9:{'color':'#3366CC','size':'30px Arial','correct':9},//512
            10:{'color':'#9966CC','size':'30px Arial','correct':9},//1024
            11:{'color':'#9933FF','size':'30px Arial','correct':9},//2048
            12:{'color':'#990066','size':'30px Arial','correct':9},//4059
            13:{'color':'#990066','size':'30px Arial','correct':9},//8192
            14:{'color':'#990066','size':'20px Arial','correct':6}//16384 以上
        };
        maThis.initMainCss();//初始化页面样式
        maThis.readWriteFile(0);//读取缓存文件并初始化数据
        maThis.monitoringOperation();//初始化监听方法
    },
    //初始化监听方法
    monitoringOperation:function () {
        //双击分数重玩
        $api.dom('#score_box').onclick = function () {
            if (maThis.clickScore == 0){
                maThis.clickScore = Date.parse(new Date());
            }else{
                if (Date.parse(new Date()) - maThis.clickScore < 1000){
                    maThis.initMainCss();//初始化页面样式
                    maThis.initData(); //初始化数据
                    maThis.writeBox(); //渲染滑框
                }
                maThis.clickScore = Date.parse(new Date());

            }
        };
        //按下事件
        document.getElementById("main_body").ontouchstart = function (event) {
            var touch = event.touches[0];
            maThis.down_position = {'x':touch.pageX, 'y':touch.pageY};
        };
        //移动事件
        document.getElementById("main_body").ontouchmove = function (event) {
            var touch = event.touches[0];
            maThis.up_position = {'x':touch.pageX, 'y':touch.pageY};
        };
        //放开事件
        document.getElementById("main_body").ontouchend = function (event) {
            if (JSON.stringify(maThis.down_position) == '{}' || JSON.stringify(maThis.up_position) == '{}') return;

            var down_position = maThis.down_position;
            var up_position = maThis.up_position;
            var x_deviation = up_position['x'] - down_position['x'];
            var y_deviation = -(up_position['y'] - down_position['y']);//由于手机坐标获取,是左上角为(0,0),和正常坐标系的Y轴是反的
            if (Math.abs(x_deviation) < 20 && Math.abs(y_deviation) < 20) return;
            var atan = Math.atan2(x_deviation,y_deviation);
            maThis.down_position = {};
            maThis.up_position = {};

            if (atan >= 0.7853981633974483 && atan < 2.356194490192345){ //右
                maThis.calculationData(1);
                return;
            }

            if (atan >= 2.356194490192345 || atan < -2.356194490192345){ //下
                maThis.calculationData(2);
                return;
            }

            if (atan >= -2.356194490192345 && atan < -0.7853981633974483){ //左
                maThis.calculationData(3);
                return;
            }else{//上
                maThis.calculationData(4);
            }
        };
    },
    //初始化页面样式
    initMainCss:function(){
        var game_div = $api.dom('.game_div');
        game_div.style.height = maThis.frameHeight+'px';
        var c=document.getElementById("game_box");
        c.width = maThis.can_width;
        c.height = maThis.can_height;
        maThis.ctx=c.getContext("2d");
    },
    //初始化数据
    initData:function(){
        //初始化滑块数据
        var write_y = 0;//列号
        var write_x = 0; //行号
        var key_name;
        var n_num = 0; //已经初始的个数
        var w_num;//写入的数字
        var probability = maThis.init_num/16;//每个格子出现数字的概率
        for (var i=0; i<16; i++){
            key_name = 'k'+write_y+write_x;//
            w_num = {'num':0,'type':0};
            if (maThis.init_num > n_num){   //判断是否满足渲染个数
                if (maThis.init_num - n_num >= 16 - i || probability > Math.random()){ //条件1:当格子剩余不足,但还有未渲染的数字时,强制最后的格子都渲染数字
                    if (maThis.viewTwo > Math.random()){
                        w_num = {'num':2,'type':1};
                    }else{
                        w_num = {'num':4,'type':2};
                    }
                    ++n_num;
                }
            }

            maThis.boxdata[key_name] = w_num;
            ++write_y;

            if (write_y > 3) {
                ++write_x;
                write_y = 0;
            }
        }
        maThis.score = 0;
        $api.dom('#score').innerHTML = maThis.score;
    },
    //渲染滑框
    writeBox:function () {
        var ctx = maThis.ctx;
        var can_height = maThis.can_height;
        var data = maThis.boxdata;//框内的数字及类型

        var small_box_l = (can_height - 20) / 4;
        var write_y = 0;//渲染的列
        var write_x = 0; //渲染的行
        var start_x,start_y;//起始点坐标
        var key_name,correct,type,num;
        for (var i=0; i<16; i++) {
            start_x = write_x * small_box_l + 4 * (write_x + 1);
            start_y = write_y * small_box_l + 4 * (write_y + 1);

            key_name = 'k'+write_y+write_x;
            type = data[key_name]['type'];
            num = data[key_name]['num'];
            correct = maThis.numType[type]['correct'];
            ctx.textAlign='center';//添加的一行代码 30 9  20 6
            ctx.font=maThis.numType[type]['size'];

            ctx.fillStyle=maThis.numType[type]['color'];
            ctx.fillRect(start_x, start_y, small_box_l, small_box_l);//画方块

            if (num){
                ctx.fillStyle="#333333";
                ctx.fillText(num,start_x+(small_box_l/2),start_y+(small_box_l/2)+correct);//画数字
            }

            ++write_y;
            if (write_y > 3) {
                ++write_x;
                if (write_x > 3) break;
                write_y = 0;
            }
        }
    },
    //每次操作后计算数据
    calculationData : function(direction){
        var write_x = 0;
        var write_y = 0;
        var record = null;
        var record_key = null;
        var key_name;
        var data = maThis.boxdata;
        switch (direction){
            case 1:
                write_x = 3;
                break;
            case 2:
                write_y = 3;
                break;
            case 3:
                write_x = 0;
                break;
            case 4:
                write_y = 0;
                break;
        }

        for (var i=0; i<16; i++){
            key_name = 'k'+write_y+write_x;
            if (record == null){
                if (data[key_name]['type'] > 0){
                    record = data[key_name]['num'];
                    record_key = key_name;
                }
            }else{
                if (data[key_name]['type'] > 0){
                    if (record == data[key_name]['num']){
                        if (data[key_name]['type'] >= 14) data[key_name]['type'] = 13;
                        maThis.score += record*2;
                        data[record_key] = {'num':record*2,'type':data[key_name]['type']+1};
                        data[key_name] = {'num':0, 'type':0};
                        record = null;
                        maThis.is_change = 1;
                    }else{//如过下一个不一样 则改变记录值
                        record = data[key_name]['num'];
                        record_key = key_name;
                    }
                }
            }

            switch (direction){
                case 1:
                    --write_x;
                    if (write_x< 0){
                        ++write_y;
                        write_x = 3;
                        record = null
                    }
                    break;
                case 2:
                    --write_y;
                    if (write_y< 0){
                        ++write_x;
                        write_y = 3;
                        record = null
                    }
                    break;
                case 3:
                    ++write_x;
                    if (write_x > 3){
                        ++write_y;
                        write_x = 0;
                        record = null
                    }
                    break;
                case 4:
                    ++write_y;
                    if (write_y > 3){
                        ++write_x;
                        write_y = 0;
                        record = null
                    }
                    break;
            }
        }
        maThis.spaceFill(direction);// 填补空格
        var is_die = maThis.checkSpace();//检测是否有空格
        if (is_die){
            if (maThis.is_change == 1){
                maThis.createRoundBox();//生成新数字
                maThis.writeBox();//渲染空格
                var score_div = $api.dom('#score');//添加分数
                score_div.innerHTML = maThis.score;
                if (maThis.score >= maThis.high_score){//如果该分数超过最高分,则更新最高分
                    maThis.high_score = maThis.score;
                    $api.dom('#high_score').innerHTML = maThis.high_score;
                }

                maThis.is_change = 0;
            }
        }else{//没有空格在检测是否game over
            var impasse = maThis.checkImpasse();
            console.log(impasse);
            if (impasse){
                alert('die');

            }
        }
    },
    //后面的数字填补前面的空格
    spaceFill:function(direction){
        var write_x = 0;
        var write_y = 0;
        var record_x = null;
        var record_y = null;
        var key_name,record_key;
        var data = maThis.boxdata;

        switch (direction){
            case 1:
                write_x = 3;
                break;
            case 2:
                write_y = 3;
                break;
            case 3:
                write_x = 0;
                break;
            case 4:
                write_y = 0;
                break;
        }

        for (var i=0; i<16; i++){
            key_name = 'k'+write_y+write_x;
            if (record_x == null){
                if (data[key_name]['type'] == 0){
                    record_x = write_x;
                    record_y = write_y;
                }
            }else{
                if (data[key_name]['type'] > 0){
                    record_key = 'k'+record_y+record_x;
                    data[record_key] = data[key_name];
                    data[key_name] = {'num':0, 'type':0};
                    switch (direction){
                        case 1:
                            --record_x;
                            break;
                        case 2:
                            --record_y;
                            break;
                        case 3:
                            ++record_x;
                            break;
                        case 4:
                            ++record_y;
                            break;
                    }
                    maThis.is_change = 1;
                }
            }

            switch (direction){
                case 1:
                    --write_x;
                    if (write_x< 0){
                        ++write_y;
                        write_x = 3;
                        record_x = null;
                    }
                    break;
                case 2:
                    --write_y;
                    if (write_y< 0){
                        ++write_x;
                        write_y = 3;
                        record_x = null;
                    }
                    break;
                case 3:
                    ++write_x;
                    if (write_x > 3){
                        ++write_y;
                        write_x = 0;
                        record_x = null;
                    }
                    break;
                case 4:
                    ++write_y;
                    if (write_y > 3){
                        ++write_x;
                        write_y = 0;
                        record_x = null;
                    }
                    break;
            }
        }
    },
    //创建新的数字
    createRoundBox:function(){
        var data = maThis.boxdata;
        var empty_key = maThis.randomNum(0,maThis.empty_key.length - 1);
        var key_name = maThis.empty_key[empty_key];

        if (maThis.viewTwo > Math.random()){
            data[key_name] = {'num':2,'type':1};
        }else{
            data[key_name] = {'num':4,'type':2};
        }
    },
    //检测是否还有空格,并把空格key保存
    checkSpace:function(){
        var data = maThis.boxdata;
        maThis.empty_key = new Array();
        var is_die = 0;
        for (var key in data) {
            if (data[key]['type'] == 0){
                maThis.empty_key.push(key);
                ++is_die;
            }
        }
        return is_die;
    },
    //获取随机数
    randomNum:function (minNum,maxNum){
        switch(arguments.length){
            case 1:
                return parseInt(Math.random()*minNum+1,10);
                break;
            case 2:
                return parseInt(Math.random()*(maxNum-minNum+1)+minNum,10);
                break;
            default:
                return 0;
                break;
        }
    },
    //检测是否已死
    checkImpasse:function () {
        var data = maThis.boxdata;
        var write_y = 0;//列坐标
        var write_x = 0; //行坐标
        var primary_key,compare1_key,compare2_key;//原key, 比较1, 比较 2
        for (var i=0; i<16; i++) {
            primary_key = 'k'+write_y+write_x;
            if (write_y +1 <= 3){
                compare1_key = 'k' + (write_y+1) + write_x;
                if (data[primary_key]['num'] == data[compare1_key]['num']){
                    return false;
                    break;
                }
            }
            if (write_x +1 <= 3){
                compare2_key = 'k' + write_y + (write_x+1);
                if (data[primary_key]['num'] == data[compare2_key]['num']){
                    return false;
                    break;
                }
            }

            ++write_y;
            if (write_y > 3) {
                ++write_x;
                if (write_x > 3) break;
                write_y = 0;
            }
        }
        return true;
    },
    //读写历史数据
    readWriteFile:function (type) {
        switch (type){
            case 0:
                api.readFile({
                    path: 'fs://history.txt',
                }, function(ret, err) {
                    if(ret.status){
                        var str = ret.data;
                        if (str != ''){
                            var res_ary = str.split('|');
                            maThis.boxdata = JSON.parse(res_ary[0]);
                            maThis.score = parseInt(res_ary[1]);
                            maThis.high_score = parseInt(res_ary[2]);
                            if (isNaN(maThis.score)) maThis.score = 0;
                            if (isNaN(maThis.high_score)) maThis.high_score = 0;

                            $api.dom('#score').innerHTML = maThis.score;
                            $api.dom('#high_score').innerHTML = maThis.high_score;
                        }else{
                            maThis.initData(); //初始化数据
                        }

                    }else{
                        maThis.initData(); //初始化数据
                    }
                    maThis.writeBox(); //渲染滑框
                    maThis.autoSave();//启动自动缓存功能
                });
                break;
            case 1:
                var str = JSON.stringify(maThis.boxdata)+'|'+maThis.score+'|'+maThis.high_score;
                api.writeFile({
                    path: 'fs://history.txt',
                    data: str
                }, function(ret, err) {
                });
                break;
        }
    },
    //自动储存
    autoSave:function () {
        setInterval(function () {
            maThis.readWriteFile(1);
        },5000);
    }
};