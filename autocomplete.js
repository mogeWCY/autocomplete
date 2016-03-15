/**
 * @module AutoComplete
 * @example ：http://1.yuhuo.applinzi.com/autocomplete/index.html
 * @Datetime: 2016-3-15
 * @version: 0.1
 * @author 浴火 <wcy.moge@gmail.com||15527807455@163.com>
 */
(function(window,document){
 var utils={
      isDOM: function (o) {
      return (
        typeof HTMLElement === 'object' ? o instanceof HTMLElement :
        o && typeof o === 'object' && o !== null && o.nodeType === 1 && typeof o.nodeName === 'string'
      );
    },
    isSupportClassList:'classList' in document.body,
    merge: function (obj1, obj2) {
      var result = {};
      for (var prop in obj1) {
        if (obj2.hasOwnProperty(prop)) {
          result[prop] = obj2[prop];
        } else {
          result[prop] = obj1[prop];
        }
      }
      return result;
    },
    addClass:function(ele,cls){
        if(this.isSupportClassList){
           var classArr=cls.split(' ');
           for(var i=0,len=classArr.length;i<len;i++){
                  ele.classList.add(classArr[i]);
           }
           return;
        }       
        var classArr=cls.split(' ');//把以空格分开的类名分开，存为数组
        for(var i=0,len=classArr.length;i<len;i++){
        	if(!this.hasClass(ele,classArr[i])){
        		ele.className+=' '+classArr[i];
        	}
        }
    },
    removeClass:function(ele,cls){//cls为一个或多个类名
    	// cls中若删除多个类，中间以空格分开
           if(this.isSupportClassList){
              var classArr=cls.split(' ');
              for(var i=0,len=classArr.length;i<len;i++){
                  ele.classList.remove(classArr[i]);
              }
              return;
           }
           var myClassArr=ele.className.split(' ');
           var classArr=cls.split(' ');
           for(var i=0,len=classArr.length;i<len;i++){
               var k=myClassArr.indexOf(classArr[i]);
               if(k!=-1){
                  myClassArr.splice(k,1);
               }
           }
           ele.className=myClassArr.join(' ');
        },
    toggle:function(ele,cls){//cls只能为一个类名
      if(this.isSupportClassList){
         ele.classList.toggle(cls);
         return;
      }
      if(!this.hasClass(ele,cls)){
              this.addClass(ele,cls);
      }else{
           this.removeClass(ele,cls);
      }
    },
    hasClass:function(ele,cls){//cls只能为一个类名
      if(this.isSupportClassList){
        return ele.classList.contains(cls);
      }
      return (" " + ele.className + " ").indexOf(" " + cls + " ") > -1;
   },
   bind:function(elem,evt, func){
   	if (elem) {
			return elem.addEventListener ? elem.addEventListener(evt, func, false) : elem.attachEvent("on" + evt, func)
    }
  },
  throttle:function(method,context){
    clearTimeout(method.tId);
    method.tId=setTimeout(function(){
      method.call(context);
    },200);
  },
  ajax:function(options){
         options =options || {};
         options.type=(options.type||'GET').toUpperCase();
         options.dataType=options.dataType || 'json';
         var params=utils.formatParams(options.data);
           if(window.XMLHttpRequest){
          var xhr= new XMLHttpRequest();
            }else{
         var xhr=new ActiveXObject('Microsoft.XMLHttp');
          }
         xhr.onreadystatechange=function(){
         if(xhr.readyState ==4){
            var status=xhr.status;
             if(status>=200&&status<300||status==304){
                  options.success&&options.success(xhr.responseText,xhr.responseXML);
             }else{
             options.fail&&options.fail(status);
        }
        }
       }
       if(options.type=='GET'){
           xhr.open('GET',options.url+"?"+params,false);
           xhr.send(params);
       }else if(options.type=='POST'){
            xhr.open('POST',options.url,false);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.send(params);
       }
      },
  formatParams:function(data) {
        var arr = [];
        for (var name in data) {
            arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]));
        }
        return arr.join("&");
    }
 };
 function Autocomplete(options){
    this.inputId=options.inputId;
    this.suggestId=options.suggestId;
    this.dataSource=options.dataSource;
    this.jumpUrl=options.jumpUrl;
    this.isShowHistory=options.isShowHistory;
    this.pageSize=options.pageSize;
    this.template="<li data-index='{index}'>{data}<b>{strongData}</b></li>";
    /** @type {Number} 当前选中的项 */
    this.listIndex=-1;
    /** @type {String}  cacheInputValue ，用up，down键遍历整个suggest列表后，暂存搜索框的值 */
    this.cacheInputValue='';
    /** @type {String} - cacheValue 存储上次输入时搜索框的值 */
    this.cacheValue='';
    /** @type {String} */
    this.jsonData='';
    /** @type {Array} 记录JSON转换成数组的数据，渲染list列表 */
    this.arr=[];
    this.init();
 }
 Autocomplete.prototype={
 	init:function(){
        this.cacheDOM();
        this.loadCSS();
        this.hide(this.suggest);
        this.bindEvents();
 	},
 	cacheDOM:function(){
       this.input=document.getElementById(this.inputId);
       this.suggest=document.getElementById(this.suggestId);
       this.ul=this.suggest.getElementsByTagName('ul')[0];
       this.allUlChilds=this.ul.getElementsByTagName('*');
       this.listItems=this.ul.getElementsByTagName('li');
 	},
  /**
   * 动态引入组件相关的css文件
   */
  loadCSS:function(){
     var link=document.createElement('link');
     link.rel='stylesheet';
     link.type='text/css';
     link.href='autocomplete.css';
     document.head.appendChild(link);
  },
 	bindEvents:function(){
       var self=this;
       this.input.addEventListener('focus',function(){
              self.render();
       },false);
       /**
        * 点击输入框以外的元素，搜素建议隐藏
        * 检查点击的元素是不是搜索建议框的子孙元素，若是就会直接跳转
        * 若不是则隐藏搜素建议框
        * 感觉此处略麻烦，可以给input设置blur事件，
        * 然后对搜索建议的子孙元素设置自定义事件，使之消失后也会触发点击
        * 但问题是怎么确定是哪个元素点击了呢，暂未想到更好的解决方案
        */
       document.addEventListener('click',function(e){
          var e=e||window.event;
          if([].indexOf.call(self.allUlChilds,e.target)==-1&&e.target!=self.input){
             self.hide(self.suggest);
           }
       },false);
       /**
        * 当suggest list向被点击之后，搜索框的value为点击项的值
        * 建议框隐藏，100ms后跳转
        */
       this.suggest.addEventListener('click',function(e){
          var e=e||window.event;
          if(e.target.tagName.toLowerCase()=='li'){
            var index=[].indexOf.call(self.listItems,e.target);
            self.input.value=self.arr[index];
            setTimeout(function(){
               self.hide(self.suggest);
               self.cacheHistoryData();
               location.href=self.jumpUrl+self.input.value;
            },100);
          }
       },false);
       /** 鼠标滑过list项*/
       this.suggest.addEventListener('mouseover',function(e){
           var e=e||window.event;
           if(e.target.tagName.toLowerCase()=='li'){
             listMoveOn.call(self,e.target);
           }
       },false);
       /**
        * 搜索框的keyup事件
        */
       this.input.addEventListener('keyup',function(e){
           var e=e||window.event;
           switch(e.keyCode){
             case 38://UP
                upKey.call(self);
                break;
             case 40://DOWN
                downKey.call(self);
                break;
             case 27://ESC
                self.hide(self.suggest);
                break;
             case 13://ENTER
                /**
                 * 点击enter，隐藏搜索建议框，跳转网址
                 */
                self.hide(self.suggest);
                self.cacheHistoryData();
                location.href=self.jumpUrl+self.input.value;
                break;
              default:
              self.cacheInputValue=self.input.value;
              /** 若输入框的value不等于上次按下键盘按钮事输入框的value
               *证明按下了字符键，就要再次向服务器端请求数据
               *若点击Capslk,shift,ctrl等功能键则不会触发请求
               *此处若采用e.keyCode判断是否按下了字符键，则判断范围大，较麻烦
               *注:字符键即字母，数字，标点符号，运算符号等
              */
              if(self.cacheValue!=self.input.value){
                /** 函数节流，取到数据并渲染 */
                utils.throttle(self.render,self);
              }
           }
       },false);
       this.input.addEventListener('keydown',function(e){
          var e=e||window.event;
          self.cacheValue=self.input.value;
       },false);
 	},
 	addActive:function(ele){
       this.clearAllActive();
       utils.addClass(ele,'over');
 	},
 	clearAllActive:function(){
       for(var i=0,len=this.listItems.length;i<len;i++){
         utils.removeClass(this.listItems[i],'over');
       }
 	},
 	show:function(ele){
        ele.style.display='block';
 	},
 	hide:function(ele){
        ele.style.display='none';
 	},
  /**
   * 处理重服务器端返回的JSON数据
   * @return {array} this.arr  存储服务器返回数据的数组
   */
 	dealFetchDatas:function(){
     this.submitQuery();
     /** data {array} 接收从服务器端返回的数据*/
     var data=this.jsonData;
     this.arr=[];
      if(data.result){
          for(var i=0,len=data.result.length;i<len;i++){
                this.arr.push(data.result[i].word);
          }
      }
     return  this.arr;
 	},
  /**
   * [submitQuery 提交关键词到服务器，并返回数据]
   * @return {[array]} [由后端返回的数据]
   */
 	submitQuery:function(){
    var self=this;
    var queryWord=this.input.value;
    utils.ajax({
       url:self.dataSource,
       type:'POST',
       dataType:'json',
       data:{query:queryWord,pageSize:self.pageSize},
       success:function(responseText){
         var data=JSON.parse(responseText);
         self.jsonData=data;
       },
       fail:function(){
         alert('服务器无响应，请稍后再试');
       }
    });
 	},
  /**
   * loadDatas  把历史记录从localStorage中取出来
   * @return {array}  历史记录组成的数组
   */
 	loadDatas:function(){
      var datas=JSON.parse(localStorage.history);
      var arr=[];
      for(var i=0,len=datas.length;i<len;i++){
          arr.push(datas[i].word);
      }
      return arr;
 	},
  /**
   * 把搜索过的关键词存进localStorage
   */
 	cacheHistoryData:function(){
       try{
          if(!window.localStorage){
            return;
          }
          var historyArr;
          if(localStorage.getItem('history')){
               historyArr=JSON.parse(localStorage.getItem('history'));
          }else{
               historyArr=[];
          }
          var historyItem={
             word:this.input.value,
             time:Date.now()
          };
          /**
           * 如果关键词在数组中已经存在，则不再push
           */
          var queryWords=[];
          historyArr.forEach(function(item,index){
              queryWords.push(item.word);
          });
          queryWords.indexOf(historyItem.word)==-1&&historyArr.push(historyItem);
          localStorage.setItem('history',JSON.stringify(historyArr));
       }catch(e){

       }
 	},
  /**
   * 合并历史记录与从服务器端获取的数据
   * @return  {object} - 返回对象
   * obj.data: 混合后的数组
   * obj.historyDataLen: 混合后的数据中历史记录所占个数
   */
  mergeData:function (){
    /** @type {obj} [存储历史记录的个数和历史记录和服务器返回的数据merge后的数组] */
    var obj={};
    var dataList=[];
    /** @type {string} 搜索关键字 */
    var query=this.input.value;
    if(this.isShowHistory){
        /** @type {array} 存储历史记录的数组 */
        var arr=this.loadDatas();
        /** 如果input框无输入，则数据全部显示为历史搜索记录并返回 */
        if(!query){
          dataList=arr;
          obj.data=dataList;
          obj.historyDataLen=arr.length;
          return obj;
        }
        /** @type {string} 返回历史记录中存在关键词的项的组成的数组 */
        var newArr=arr.filter(function(item,index){
              return item.indexOf(query)==0;
        });
        /**
         * 判断由历史记录中存在关键词的项的组成的数组是否大于规定的每页显示的长度
         * 若大于或等于则datalist都是历史记录组成的
         * 否则dataList中先由历史记录中的项填充，然后再由服务器端的数据填充，直至数据长度达到pageSize
         */
        if(newArr.length>=this.pageSize){
          dataList=newArr.slice(0,this.pageSize);
        }else{
           var dataArr=this.dealFetchDatas();
           /**
            * dataList 把两个数组连接起来
            * @type {[array]}
            */
           dataList=newArr.concat(dataArr);
           for(var i=0,len=newArr.length;i<len;i++){
             if(newArr.indexOf(dataArr[i])==-1&&i<this.pageSize-len,i++){
                dataList.push(dataArr[i]);
             }
           }
        }
      obj.historyDataLen=newArr.length;
    }else{
      dataList=this.dealFetchDatas();
      obj.historyDataLen=0;
    }
    obj.data=dataList;
    return obj;
  },
  /**
   * 取到数据，拼接html字符串,渲染suggest list
   */
 	render:function(){
        if(!this.input.value&&!this.isShowHistory){return };
        /**
         *dataList 为返回的历史记录和服务器混合后的数据
         * @type {array}
         */
        var dataList=this.mergeData().data;
        var historyDataLen=this.mergeData().historyDataLen;
        var inputValueLen=this.input.value.length;
        var ulHtml="";
        for(var i=0,len=dataList.length;i<len;i++){
           if(dataList[i].indexOf(this.input.value)==0){
            /**
             * strongData - 取得要加粗显示的字符串
             * @type {string}
             */
              var strongData=dataList[i].slice(inputValueLen,dataList[i].length);
              ulHtml+=this.template.replace('{index}',i).replace('{data}',this.input.value).replace('{strongData}',strongData);
           }else{
              ulHtml+=this.template.replace('{index}',i).replace('{data}',dataList[i]).replace('<b>{strongData}</b>','');
           }
        }
        this.ul.innerHTML=ulHtml;
        /**
         * 区别历史记录中文字，加上颜色
         */
        for(var i=0;i<historyDataLen;i++){
          this.listItems[i].style.color='rgb(122, 119, 200)';
        }
        /** 显示suggest列表 */
        this.show(this.suggest);
 	}
 }
 /**
  * 点击UP键绑定的函数
  * 点击后listIndex递增
  * 清空所有list项的over样式
  * 为该项添加over样式
  * 判断边界
  */
 function upKey(){
     this.listIndex--;
    if(this.listIndex===-1){
      this.input.value=this.cacheInputValue;
      this.clearAllActive();
      return;
    }
    if(this.listIndex===-2){
      this.listIndex=Math.min(this.listItems.length,this.pageSize)-1;
    }
    this.addActive(this.listItems[this.listIndex]);
    this.input.value=this.arr[this.listIndex];
 }
 /**
  * 点击DOWN键绑定的函数
  * 类似于upKey函数
  */
 function downKey(){//keyDown
    this.listIndex++;
    if(this.listIndex==Math.min(this.listItems.length,this.pageSize)){
      this.input.value=this.cacheInputValue;
      this.listIndex=-1;
      this.clearAllActive();
      return;
    }
    this.addActive(this.listItems[this.listIndex]);
    this.input.value=this.arr[this.listIndex];
 }
 /**
  * @param  {element} ele list项
  * 为鼠标move上的list项添加over样式
  * 改变listIndex为当前鼠标停留的项
  */
 function listMoveOn(ele){
   this.addActive(ele);
   this.listIndex=[].indexOf.call(this.listItems,ele);
 }
 window.Autocomplete=Autocomplete;
})(window,document);