var gl;
var angle = 0.0;
var delta = 60.0;
var size = 25;
var u_Angle;

window.onload = function main(){//onload：决定当前页面加载完成后从哪开始执行程序
    var canvas = document.getElementById("webgl");//通过id获取元素canvas
    if(!canvas){
        alert("获取元素失败");
        return;
    }
    gl = WebGLUtils.setupWebGL(canvas);//理解为返回webgl的对象
    if(!gl){
        alert("获得WebGL上下文失败！");
        return;
    }
    //顶点位置数据
    var vertices = [//顶点坐标位裁剪坐标系下坐标
        vec2(-size,-size),vec2(size,-size),
        vec2(size,size),vec2(-size,size)];

    // //设置WebGL相关属性  gl.viewport(x，y，width，height）
    // gl.viewport(0, // 视口左边界距离canvas左边界距离
    //             0, // 视口下边界距离canvas下边界距离
    //             canvas.width, 	// 视口宽度
    //             canvas.height);	// 视口高度
    /*设置WebGL相关属性*/
	// 获取canvas矩形在页面客户区中的位置
	var rect = canvas.getBoundingClientRect();
	// 根据调整后的页面窗口内部大小调整canvas尺寸
	canvas.width  = innerWidth - 2 * rect.left;
	canvas.height = innerHeight - 80;
	if(canvas.width > canvas.height)
		gl.viewport((canvas.width - canvas.height) / 2, 
			0, canvas.height, canvas.height);
	else
		gl.viewport(0, (canvas.height - canvas.width) / 2, 
			canvas.width, canvas.width);

    gl.clearColor(0.0, 0.0, 0.0, 1.0); // 设置背景色为黑色 gl.clearColor(red,green,blue,alpha)

    //加载shader程序并为shader中的attribute变量提供数据
    //初始化shader
    var program = initShaders(gl,
                              "vertex-shader", 
                              "fragment-shader");

    gl.useProgram(program);	// 启用该shader程序对象  

    //将顶点属性数据传输到GPU
    var bufferId = gl.createBuffer();//创建buffer并返回id
    gl.bindBuffer(gl.ARRAY_BUFFER,bufferId);//当前bufferID绑定给当前ARRAY_BUFFER，存储顶点数据，传给下行代码处理当前buffer
    //传输数据给GPI
    gl.bufferData(gl.ARRAY_BUFFER,//上一行绑定的buffer
                    flatten(vertices),//具体数据来源，数组，（不接受js的数组，因为它是对象）这里利用MV.js里的函数转换
                    gl.STATIC_DRAW);//buffer的优化参数
                    
    
     //有了数据后需要告诉cpu怎么利用
    //为shader属性变量与buffer数据建立关联
    //获取name参数（a_Position）指定的attribute变量存储地址
    //program指上面初始化shader，将shader中的数据赋予给程序对象a_Position
    //name 是顶点着色器中我们定义的attribute类型的变量a_Position
    var a_Position = gl.getAttribLocation(program,"a_Position");
    if(a_Position<0){
        alert("获取attribute变量a_Position失败！");
        return;
    }
    //gl.vertexAttribPointer(location,size,type,normalized,stride,offset)
    //将绑定给当前buffer的对象给我们初始化shader中的变量，这样attribute类型的变量就有数据了
    //location 指定分配给attribute变量存储位置
    //size 顶点数据的分量 此处为vec2【*，*】，所以是2
    //gl.UNSIGNED_BYTE:无符号字节   gl.SHORT：短整型 gl.UNSIGNED_SHORT 无符号短整型
    //gl.INT：整形  gl.UNSIGNED_INT:无符号整型  gl.FLOAT: 浮点型
    //normalized 是否出入顶点数据分量，是否符合格式
    //stride 相邻两个顶点间的字节数，默认为0
    //offset attribute变量从缓冲区何处开始存储
    gl.vertexAttribPointer(a_Position,2,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(a_Position);//启动顶点属性数组

    // 获取shader中uniform变量"u_Angle"的索引
	u_Angle = gl.getUniformLocation(program, "u_Angle");
	if(!u_Angle){
		alert("获取uniform变量u_Angle失败!");
		return;
	}
	
	// 获取shader中uniform变量"u_matProj"的索引
	var u_matProj = gl.getUniformLocation(program, "u_matProj");
	if(!u_matProj){
		alert("获取uniform变量u_matProj失败!");
		return;
	}

    // 设置视域体，ortho2D四个参数分别为x和y的范围
	var matProj = ortho2D(-size * 2, size * 2, -size * 2, size * 2);
	gl.uniformMatrix4fv(u_matProj, false, flatten(matProj));
	// 获取shader中uniform变量"u_Color"的索引
	var u_Color = gl.getUniformLocation(program, "u_Color");
	if(!u_Color){
		alert("获取uniform变量u_Color失败!");
		return;
	}
    gl.uniform3f(u_Color, 1.0, 0.5, 0.5);// 设置颜色(白色)
    


    //加速按钮点击事件
    var incButton = document.getElementById("IncSpeed");
    if(!incButton)
        alert("获取按钮元素IncSpeed失败");
    incButton.onclick = function(){
        delta *=2;
    };
    //减速按钮点击事件
    var DecButton = document.getElementById("DecSpeed");
    if(!DecButton)
        alert("获取按钮元素DecButton失败");
    DecButton.onclick = function(){
        delta /=2;
    };

    //菜单颜色xuanze
    var colorSelect = document.getElementById("ColorMenu");
    if(!colorSelect)
        alert("获取菜单元素colorSelect失败");
    colorSelect.onclick = function(){ 
        switch(event.target.index){
            case 0:
                gl.uniform3f(u_Color, 1.0, 1.0, 1.0);
                break;
            case 1:
                gl.uniform3f(u_Color, 1.0, 0.0, 0.0);
                break;
            case 2:
                gl.uniform3f(u_Color, 0.0, 1.0, 0.0);
                break;
            case 3:
                gl.uniform3f(u_Color, 0.0, 0.0, 1.0);
                break;
        }
    }

    //添加窗口resize事件响应
    window.onresize = function(){
        var rect = canvas.getBoundingClientRect();
        canvas.width = innerWidth - 2*rect.left;
        canvas.height = innerHeight - 80;
        if(canvas.width > canvas.height)
            gl.viewport((canvas.width - canvas.height)/2,
                0, canvas.height,canvas.height);
        else
            gl.viewport(0, (canvas.height - canvas.width)/2,
                 canvas.width,canvas.width);
    }

    render();//进行绘制


};

// 记录上一次调用函数的时刻
var last = Date.now();

// 绘制函数
function render() {
	// 计算距离上次调用经过多长的时间
	var now = Date.now();
	var elapsed = now - last; // 毫秒
	last = now;
	// 根据距离上次调用的时间，更新当前旋转角度
	angle += delta * elapsed / 1000.0;
	angle %= 360;	// 防止溢出
	
	gl.uniform1f(u_Angle, angle); // 将旋转角度传给u_Angle
	
	gl.clear(gl.COLOR_BUFFER_BIT); // 用背景色擦除窗口内容
   
	// 使用顶点数组进行绘制
	gl.drawArrays(gl.TRIANGLE_FAN, // 绘制图元类型为三角扇
		0, 		// 从第0个顶点属性数据开始绘制
		4);		// 使用4个顶点属性数据
	
	requestAnimFrame(render);
}
