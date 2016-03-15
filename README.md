# autocomplete
autocomplete---自动完成组件
在html文件里引入`autocomplete.js`即可，注意，`autocomplete.js`和`autocomplete.css`文件要放在同一目录下。
`<script src='autocomplete.js></script>`
### 该组件参照了百度，必应，搜狗等搜索引擎的自动完成框的显示效果，并基本还原
### 可观看我录制的视频[这里][1]

在html里写好如下结构
```
	<input type="text" id='search'>
	<div id="suggest">
		<ul>
		</ul>
	</div>
```
```
var auto=new Autocomplete({
         inputId:'search',
         suggestId:'suggest',
         dataSource:'demo.php',
         isShowHistory:true,
         jumpUrl:'https://www.sogou.com/web?query=',
         pageSize:5
	});
```
`inputId`是搜索框的id，
`suggest`是搜索建议的id,
`dataSource`是数据请求的地址，本例中为`demo.php`,
`isShowHistory`是规定在搜索记录中是否显示历史记录，即以前搜索过的关键词，该数据存在，
`jumpUrl`,对应跳转后的网址
`localStorage`中,所以不支持localStorage的浏览器是怎么也看不到历史记录的，
`pageSize`是指搜索建议能显示的最大数量，本例中为5条


  [1]: http://1.yuhuo.sinaapp.com/test.webm
