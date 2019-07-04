/**
 ** 开箱即用审批流前端
 ** 使用方式:首先修改默认的填充样式,然后修改最后的全局变量名称防止变量名冲突
 ** 注：确保在jquery,jqgrid之后引用,确保审批页面有引用该文件，可以绑定在bounding或是laylout里
 ** author:fangyihang
 ** createTime:20190423 
 **/
function Examine() {
    var _this = this;

    //this.IsNav = false;弃用，我忘记掉想干嘛用的了

    this.Pid = "";//当前登录用户的ID

    this.Oid = "";//审批流对象的ID

    this.Tid = "";//项目ID-拓展字段

    this.ExamineType = "default";

    this.BeforeOpenCheck = function () { };

    this.BeforeOpenHistory= function () { };

    this.BeforeOpenBack = function () { };

    this.BeforeExaminerSubmit = function () { };

    this.BeforeInitiatorSubmit = function () { };

    this.GetCurrentExamineUrl = "/NewExamine/GetCurrentExamine";//获取当前审批流信息url

    this.ExaminerSubmitUrl= "/NewExamine/SubmitExamine",//审批方提交审核结果url

    this.ExaminerSubmitCallback = function (arg, c) { };//提交成功后的回调函数，arg为最初提交的参数的，c为返回的结果1成功0失败

    this.InitiatorSubmitUrl = "/NewExamine/InitExamine",//提交方发起审核url

    this.InitiatorSubmitCallback = function (arg, c) { };//提交成功后的回调函数，arg为最初提交的参数的，c为返回的结果1成功0失败

    this.BackUrl = "/NewExamine/BackExamine";

    this.BackCallback = function (arg, c) { };//退回成功后的回调函数，arg为最初提交的参数的，c为返回的结果1成功0失败

    this.InitCallBack = function (arg, c) { };//审批流初始化完成后的回调函数

    this.IsInitiator = false;//是否为审批发起者，即时提交审批页面还是审批页面

    this.CurrentFrameIndex = 0;//当前弹出框的index

    this.Option = {

        position: "defult",//所处位置默认在页面最下方居中

        oparaDom: "#",//假设上方为after或者prev时，代表按钮在oparaDom之前后生成

        style: "",

        dom1: default_dom,

        dom2: default_dom2,

        check_dom: check_dom,

        history_dom: history_dom
    };

    this.Config = {
        //配置信息，用来申明调用方法获取审批流程对象对应的属性名
        IsLast: "IsLast",//是否为最后一级
        NeedExamine: "NeedExamine",//当前用户是否需要审核
        UserID: "UserID",//当前用户ID
        ExamineObjectID: "ExamineObjectID",//当前审批对象ID
        ExamineProjectID: "ExamineProjectID",//审批流主表ID
        ExamineProjectFlowID: "ExamineProjectFlowID",//审批流节点ID
        ExamineProjectID: "ExamineProjectID",//当前审批对象ID
        CanBack: "CanBack",//是否有退回权限
    };

    this.ExaminerCofig = {
        AvoidBtns: [],//默认移除的按钮

        AddBtns: [],//[{ id: "csbtn001", class: "btn btn-primary radius", icon:"&#xe632;",text:"测试按钮"}],//需要添加的按钮，id、text、theme设计希望同layer保持一致，按钮的点击事件应该于初始化按钮结束后的回调进行绑定

        DisabledBtns:[]//需要设为不可用的按钮，弃用改实现应该在生成后的回调方法里去实现
    }

    this.SubmitArg = [];//提交请求时的参数

    this.BackArg = [];//退回请求时的参数
    
    this.OperaObj = null;

    //所属模块，默认为当前除去参数的地址
    this.Module = window.location.href.substring(0, window.location.href.indexOf('?') == -1 ? window.location.href.length : window.location.href.indexOf('?'));

    this.CurrentExamineArg = { url: this.Module, id: this.Oid, Tid: this.Tid };

    this.Init = function (option) {
        $.extend(true, this.Option, option);
        
        //根据所属模块和操作对象ID去获取对应的审批流信息
        $.post(this.GetCurrentExamineUrl, { url: this.Module, id: this.Oid, Tid: this.Tid }
            , function (r) {
                if (r.code == 0) {
                    jyLayer.error(r.message);
                    return;
                    //存在审批流
                } else if (r.code == 1) {
                    //要求js处理域回来，不然永远在window.top
                    window.self;
                    var obj = r.data;
                    _this.OperaObj = obj;
                    _this.Pid = obj[_this.Config.UserID];
                    _this.Oid = obj[_this.Config.ExamineObjectID];
                        //如果是审批发起者
                    if (_this.IsInitiator) {
                            //$.post("/NewExamine/GetCurrentExamine", { url: F_Examine.Module, id: window.self.F_Examine.Oid }
                        //    //$.post("/NewExamine/GetCurrentExamine", { url: '/WoodOrTraffic/ExamineList', id: F_Examine.Oid }
                        //    , function (r) {
                        //        //如果不存在审批流
                        //        if (r.code = -999) {

                        //        }
                        //    })
                        return false;
                    }
                    //如果当前用户为审批人
                    //if (obj.ExaminerIDs.includes(_this.Pid)) {
                    if (obj.NeedExamine) {
                        _this.SubmitArg = { flowid: obj[_this.Config.ExamineProjectFlowID] };
                        _this.BackArg = { projectid: obj[_this.Config.ExamineProjectID] };
                        _this.InitBtn(2, _this.AfterInitBtn);
                        $("#" + "checkbox_" + _this.Module + _this.Oid + " [name='btn_examine_2']").remove();
                    } else {
                        //如果当前用户非审批人
                        //将审批按钮置灰
                        _this.BackArg = { projectid: obj[_this.Config.ExamineProjectID] };
                        _this.InitBtn(2, _this.AfterInitBtn);
                        $("#" + "checkbox_" + _this.Module + _this.Oid + " [name='btn_examine_1']").addClass("disabled");
                        $("#" + "checkbox_" + _this.Module + _this.Oid + " [name='btn_examine_1']").attr("disabled", "disabled");
                        //如果当前用户无退回权限
                        if (!obj[_this.Config.CanBack]) {
                            $("#" + "checkbox_" + _this.Module + _this.Oid + " [name='btn_examine_2']").addClass("disabled");
                            $("#" + "checkbox_" + _this.Module + _this.Oid + " [name='btn_examine_2']").attr("disabled", "disabled");
                        }
                        return;
                    }
                    //不存在审批流
                } else if (r.code == -999) {
                    //当前用户为提交者,就应该存在提交审批按钮
                    if (_this.IsInitiator) {
                        _this.InitBtn(1, _this.AfterInitBtn);
                    }
                }
            });
    };

    //审批流的打开审核页面操作
    this.OpenCheck = function () {
        if (_this.BeforeOpenCheck() == false) return false;
        _this.CurrentFrameIndex = layer.open({
            title: "审核页面",
            type: 1,
            content: check_dom,
            area: ["780px", "500px"],
            id: "confirm_" + _this.Module + _this.Oid
        });
        $("#" + "confirm_" + _this.Module + _this.Oid + " [name='btn_examine_1']").bind("click", function () {
            _this.ExaminerSubmit();
        });
    };

    //审批流的提交操作
    this.ExaminerSubmit = function () {
        if (_this.BeforeExaminerSubmit() == false) return false;
        _this.SubmitArg = $.extend(true, _this.SubmitArg, { status: parseInt($("[name=radio1]:checked").val()), content: $("#examine_content").val() });
        $.post(_this.ExaminerSubmitUrl, _this.SubmitArg
            , function (r) {
                if (r.code == 0) {
                    jyLayer.error(r.message);
                    jyLayer.close(_this.CurrentFrameIndex);
                    return;
                } else if (r.code == 1) {
                    //如果不通过也返回
                    if (parseInt($("[name=radio1]:checked").val()) == 0 || _this.OperaObj.IsLast) {
                        _this.ExaminerSubmitCallback(JSON.stringify(_this.SubmitArg), 1);
                    } else {
                        jyLayer.success(r.message);
                        jyLayer.close(_this.CurrentFrameIndex);
                        window.location.reload();
                    }
                    jyLayer.success(r.message);
                    jyLayer.close(_this.CurrentFrameIndex);
                    return;
                }
            });
    };

    this.InitiatorSubmit = function () {
        if (_this.BeforeInitiatorSubmit() == false) return false;
        _this.SubmitArg = $.extend(true, _this.SubmitArg, { status: parseInt($("[name=radio1]:checked").val()), content: $("#examine_content").val() });
    }

    //打开历史记录操作
    this.OpenHistory = function () {
        if (_this.BeforeOpenHistory() == false) return false;
        this.CurrentFrameIndex = layer.open({
            title: "审核记录",
            type: 1,
            content: history_dom,
            area: ["780px", "500px"],
            success: function () {
                EjyGrid.postData.filter = "[{\"Key\":\"ID\",\"Value\":\"" + _this.OperaObj.ExamineProjectID + "\",\"Contrast\":\"=\"}]";
                EjyGrid.init();
            }
        });
    };

    //审批流退回操作
    this.ExamineBack = function () {
        if (_this.BeforeOpenBack() == false) return false;
        layer.confirm('确认是否退回?', function (index) {
            $.post(_this.BackUrl, _this.BackArg
                , function (r) {
                    if (r.code == 0) {
                        jyLayer.error(r.message);
                        layer.close(index);
                        return;
                    } else if (r.code == 1) {
                        if (_this.OperaObj.CanBack) {
                            _this.BackCallback(_this.BackArg.content, 1)
                        }
                        jyLayer.success(r.message);
                        layer.close(index);
                        return;
                    }
                }
            );

        });
    };

    //初始化按钮t:type即填充那个dom元素
    this.InitBtn = function (t,callback) {
        if (t == 2) {
            var tempDom = $(_this.Option.dom2).attr("id", "checkbox_" + _this.Module + _this.Oid);
            var addBtns = _this.ExaminerCofig.AddBtns;
            for (var ab in addBtns) {
                var btnDom = $("<button></button>").addClass(addBtns[ab].class).attr("id", addBtns[ab].id);
                var iDom = $("<i class=\"Hui-iconfont\"></i>").html(addBtns[ab].icon);
                btnDom.html(iDom[0].outerHTML + addBtns[ab].text);
                tempDom.append(btnDom);
            }
            if (_this.Option.position == "defult" || _this.Option.position == "") {
                $('body').append(tempDom);
            } else {
                switch (_this.Option.position) {
                    case "":
                    case "":
                    default:
                        $(_this.Option.oparaDom).after(tempDom);
                }
            }
            $("#" + "checkbox_" + _this.Module + _this.Oid + " [name='btn_examine_1']").bind("click", function () {
                _this.OpenCheck();
            });
            $("#" + "checkbox_" + _this.Module + _this.Oid + " [name='btn_examine_2']").bind("click", function () {
                _this.ExamineBack();
            });
            $("#" + "checkbox_" + _this.Module + _this.Oid + " [name='btn_examine_3']").bind("click", function () {
                _this.OpenHistory();
            });
        } else if (t == 1) {
            var tempDom = $(_this.Option.dom1).attr("id", "submitbox_" + _this.Module + _this.Oid);
            var addBtns = _this.ExaminerCofig.AddBtns;
            for (var ab in addBtns) {
                var btnDom = $("<button></button>").addClass(addBtns[ab].class).attr("id", addBtns[ab].id);
                var iDom = $("<i class=\"Hui-iconfont\"></i>").html(addBtns[ab].icon);
                btnDom.html(iDom[0].outerHTML + addBtns[ab].text);
                tempDom.append(btnDom);
            }
            if (_this.Option.position == 'defult' || _this.Option.position == "") {
                $('body').append(tempDom);
            } else {
                switch (_this.Option.position) {
                    case "":
                    case "":
                    default:
                        $(_this.Option.oparaDom).append(_this.Option, dom1);
                }
            }
            $("#" + "submitbox_" + _this.Module + _this.Oid + " [name='btn_examine_1']").bind("click", function () {
                _this.OpenCheck();
            });
            $("#" + "submitbox_" + _this.Module + _this.Oid + " [name='btn_examine_2']").bind("click", function () {
                _this.OpenHistory();
            });
        }
        loadStyleString(_this.Option.style);
        callback;
    };

    //初始化按钮后执行的方法
    this.AfterInitBtn = function(t){

    };
}
    ////如果不存在全局变量则创建它，
    //if (!window.F_Examine) {
    //    window.top.F_Examine = new Examine();
    //};

    function loadStyleString(cssText) {
        var style = document.createElement("style");
        style.type = "text/css";
        try {
            // firefox、safari、chrome和Opera
            style.appendChild(document.createTextNode(cssText));
        } catch (ex) {
            // IE早期的浏览器 ,需要使用style元素的stylesheet属性的cssText属性
            style.styleSheet.cssText = cssText;
        }
        document.getElementsByTagName("head")[0].appendChild(style);
    }

    //初始化审批流程,可以在这里解除注释这样就是所有页面都会尝试执行，否则需要在审批页面自行初始化该方法已失效
    //F_Examine.Init();

//默认的审批流按钮框
var default_dom = "<div class='text-c mt-10' style='margin-bottom: 10px; '>\
<button type='button' class='btn btn-primary radius' name='btn_examine_1'><i class='Hui-iconfont'>&#xe632;</i>提交审批</button>\
<button type='button' style='margin-left:20px;' class='btn btn-primary radius' name='btn_examine_2'> 审批记录 </button></div>";

//默认的审批流按钮框
var default_dom2 = "<div class='text-c mt-10' style='margin-bottom: 10px;'>\
<button type='button' class='btn btn-primary radius'  name='btn_examine_1'><i class='Hui-iconfont'>&#xe632;</i>审核</button>\
<button type='button' style='margin-left:20px;' class='btn btn-primary radius'name='btn_examine_2'>退回</button>\
<button type='button' style='margin-left:20px;' class='btn btn-primary radius' name='btn_examine_3'> 审批记录 </button></div>";

//审批框
var check_dom = "<div>\
    <form class='form form-horizontal' style = 'overflow-y: hidden;'>\
        <div class='row cl'>\
            <label class='form-label col-w-m'><span class='impt'>*</span>审核结果：</label>\
            <div class='formControls' style='display: inline-block; margin-left: 15px;'>\
                <input type='radio' name='radio1' value='1' checked='checked'/><span>通过</span>\
            </div>\
            <div class='formControls' style='display: inline-block; margin-left: 65px;'>\
                <input type='radio' name='radio1' value='0' /><span>不通过</span>\
            </div>\
        </div>\
        <div class='row cl'>\
            <label class='form-label  col-w-m' id='yijian'>审核意见：</label>\
            <div class='formControls col-xs-4 '>\
                <textarea id='examine_content' style='width:400px;height:115px'></textarea>\
            </div>\
        </div>\
        <div class='text-c' style='height:15%; padding: 5px;'>\
            <input class='btn btn-primary radius' type='button' value='确定' name='btn_examine_1' style='margin-top:18px'>\
        </div>\
    </form>\
</div >";
//内嵌进度框
var progress_dom = "";

//历史记录框
var history_dom = "<div class='page-container'>\
    <div class='mt-15 pd-5' >\
        <table id='EgridData'></table>\
        <div id='EgridPager'></div>\
    </div >\
</div >";

//实例化表格对象后期改为非依赖形式
var EjyGrid = new JyGrid("/NewExamine/GetExamineHistory");

//初始化审批记录表
EjyGrid.colNames = ["ID", "审批人", "审批结果", "审批意见", "审批时间"];
EjyGrid.colModel = [
    { name: 'ID', hidden: true },
    { name: 'ExaminerName', width: '24 % ', align: 'center' },
    {
        name: 'CurrentTurn', width: '12%', align: 'center', formatter: function (cellvalue, options, row) {

            if (cellvalue) {
                return "已通过";
            } else {
                return "不通过";
            }
            return cellvalue;
        }
    },
    { name: 'Result', width: '34%', align: 'center' },
    { name: 'ExaminingTime', width: '12%', align: 'center', formatter: "date", formatoptions: { srcformat: 'Y-m-d H:i:s', newformat: 'Y-m-d H:i:s' } }
];
EjyGrid.selector = "#EgridData";
EjyGrid.pager = "#EgridPager";
EjyGrid.multiselect = false;
EjyGrid.jsonReader = { id: "ID" };
EjyGrid.sortname = "createtime";