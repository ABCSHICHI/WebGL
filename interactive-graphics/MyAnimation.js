var NumTimesToSubdivide = 10;//递归次数
//
var branchAngle = -1.57;
var trunkratio = 0.32;
var gl;
var angle = 0.0;
var rotationAngle = 60.0;
var zoomAngle = 0.02;
var size = 25;
var u_Angle;
points = []; //存放顶点坐标的数组，初始为空
var vertices = [//顶点坐标位裁剪坐标系下坐标
        
    vec2(0.0,0.0),vec2(0.0,0.6),
    vec2(0.0,0.0),vec2(0.0,-0.6),
    ];
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
    updateData(branchAngle);
                    
    
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
	var matProj = ortho2D(-1, 1, -1, 1);
	gl.uniformMatrix4fv(u_matProj, false, flatten(matProj));


    var u_Color = gl.getUniformLocation(program, "u_Color");
	if(!u_Color){
		alert("获取uniform变量u_Color失败!");
		return;
	}
    gl.uniform3f(u_Color, 0.0, 1.0, 0.0);// 设置颜色
    
    //旋转加速按钮点击事件
    var rotateIncButton = document.getElementById("rotateIncSpeed");
    if(!rotateIncButton)
        alert("获取按钮元素IncSpeed失败");
    rotateIncButton.onclick = function(){
        rotationAngle *=2;
    };
    //旋转减速按钮点击事件
    var rotateDecButton = document.getElementById("rotateDecSpeed");
    if(!rotateDecButton)
        alert("获取按钮元素DecButton失败");
    rotateDecButton.onclick = function(){
        rotationAngle /=2;
    };
    //缩放加速按钮点击事件
    var zoomIncButton = document.getElementById("zoomIncSpeed");
    if(!zoomIncButton)
        alert("获取按钮元素IncSpeed失败");
    zoomIncButton.onclick = function(){
        zoomAngle *=2;
    };
    //缩放减速按钮点击事件
    var zoomDecButton = document.getElementById("zoomDecSpeed");
    if(!zoomDecButton)
        alert("获取按钮元素DecButton失败");
        zoomDecButton.onclick = function(){
        zoomAngle /=2;
    };

    var lengthSilder = document.getElementById("branchLength");
    if(!lengthSilder)
        alert("获取按钮元素DecButton失败");
    lengthSilder.onchange = function(){
        trunkratio = event.srcElement.value/100;
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

function updateData(branchAngle){
    points.length = 0;
    //绘制分形树
    drawBranches(vertices[0],vertices[1],NumTimesToSubdivide,branchAngle);
    drawBranches(vertices[2],vertices[3],NumTimesToSubdivide,branchAngle);
    
    //传输数据给GPI
    gl.bufferData(gl.ARRAY_BUFFER,//上一行绑定的buffer
                    flatten(points),//具体数据来源，数组，（不接受js的数组，因为它是对象）这里利用MV.js里的函数转换
                    gl.STATIC_DRAW);//buffer的优化参数
    points.length = 0;
}


// 记录上一次调用函数的时刻
var last = Date.now();

// 绘制函数
function render() {
	// 计算距离上次调用经过多长的时间
    var now = Date.now();
	var elapsed = now - last; // 毫秒
	last = now;
	// 根据距离上次调用的时间，更新当前旋转角度
	angle += rotationAngle * elapsed / 1000.0;
    angle %= 360;	// 防止溢出
    branchAngle += zoomAngle;
	updateData(branchAngle)
	gl.uniform1f(u_Angle, angle); // 将旋转角度传给u_Angle
	
	gl.clear(gl.COLOR_BUFFER_BIT); // 用背景色擦除窗口内容
   
	// 使用顶点数组进行绘制
	gl.drawArrays(gl.LINES, // 绘制图元类型为三角扇
		0, 		// 从第0个顶点属性数据开始绘制
		3069*4);		// 使用4个顶点属性数据
	
	requestAnimFrame(render);
}
//将三角形的顶点坐标加入数组中
//a,b,c为三角形的三个顶点坐标
function triangle(a,b){
    points.push(a);
    points.push(b);
}

//递归细分三角形
//k用于控制细分次数
function drawBranches(a,b,k,branchAngle){

    if(k>0){
        var dx= b[0] - a[0];
        var dy= b[1] - a[1];
        var dist = Math.sqrt(dx*dx+dy*dy);
        var angle = Math.atan2(dy,dx);
        var branchLength= dist*(1-trunkratio);
        var pA = mult(0.5,add(a,b));
        var pB =vec2(pA[0] + Math.cos(angle + branchAngle) * branchLength,
                    pA[1] + Math.sin(angle + branchAngle) * branchLength);
        var pC =vec2(pA[0] + Math.cos(angle - branchAngle) * branchLength,
                    pA[1] + Math.sin(angle - branchAngle) * branchLength);
        
        
        triangle(a,pA);
        triangle(pA,mult(0.5,add(pA,pB)));
        triangle(pA,mult(0.5,add(pA,pC)));
        drawBranches(pA,pB,k-1,branchAngle);
        drawBranches(pA,pC,k-1,branchAngle);

        
    }
    else
        return 0;
      
}