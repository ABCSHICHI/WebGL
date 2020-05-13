// Morph.js

// 全局变量
var gl;				// WebGL上下文
var halfSize = 1; //正方形边长一半
var u_MVPMatrix; //shader中uniform、变量u_MVPMatrix的索引
var matProj; //投影矩阵，在main中赋值，在render中使用

var angle = [0.0,0.0,0.0];//绕3个旋转轴旋转的角度，初始化为0
var axis = 1; //当前旋转轴（0-x  1-y  2-z）
var delta = 60; // 每秒角度增量

var nVertexCountPerSide = 20;//正方形细分后每行顶点数
var nVertexCount = nVertexCountPerSide * nVertexCountPerSide;//一面的顶点数
var nTriangleCount = (nVertexCountPerSide-1)*(nVertexCountPerSide-1)*2;
var nIndexCount = 3*nTriangleCount;//一个面的顶底索引数

var time = 0;
var u_Time;
// 页面加载完成后会调用此函数，函数名可任意(不一定为main)
window.onload = function main(){
	// 获取页面中id为webgl的canvas元素
    var canvas = document.getElementById("webgl");
	if(!canvas){ // 获取失败？
		alert("获取canvas元素失败！"); 
		return;
	}
	
	// 利用辅助程序文件中的功能获取WebGL上下文
	// 成功则后面可通过gl来调用WebGL的函数
    gl = WebGLUtils.setupWebGL(canvas);    
    if (!gl){ // 失败则弹出信息
		alert("获取WebGL上下文失败！"); 
		return;
	}        

	/*设置WebGL相关属性*/
	// 设置视口，占满整个canvas
	gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0); // 设置背景色为白色
	gl.enable(gl.DEPTH_TEST);	// 开启深度检测
	gl.enable(gl.CULL_FACE);	// 开启面剔除，默认剔除背面
     
	/*待添加顶点坐标数据初始化*/
	// var vertices = [
	// 	//前
	// 	vec3(-halfSize, -halfSize, halfSize),//左下
	// 	vec3(-halfSize, halfSize,halfSize),//左上
	// 	vec3(halfSize, halfSize,halfSize),//右上
	// 	vec3(halfSize, -halfSize,halfSize),//右下
	// 	//后
	// 	vec3(-halfSize, -halfSize, -halfSize),//左下
	// 	vec3(-halfSize, halfSize,-halfSize),//左上
	// 	vec3(halfSize, halfSize,-halfSize),//右上
	// 	vec3(halfSize, -halfSize,-halfSize),//右下
	// ];
	var vertices = [];
	//x和y方向相邻顶点间接
	var step = halfSize * 2 / (nVertexCountPerSide - 1);
	var y = this.halfSize;//初始化y坐标
	//计算前面所有顶点
	for(var i=0; i<nVertexCountPerSide; i++){
		var x = -this.halfSize;
		for(var j=0; j<nVertexCountPerSide; j++){
			vertices.push(vec3(x, y, halfSize));
			x += step;
		}
		y -= step;
	}

	/*索引数组*/
	// var indexes = new Uint8Array([
	// 	1, 0, 3, 1, 3, 2,//前
	// 	6, 7, 4, 6, 4, 5,//后
	// 	5, 4, 0, 5, 0, 1,//左
	// 	2, 3, 7, 2, 7, 6,//右
	// 	5, 1, 2, 5, 2, 6,//上
	// 	0, 4, 7, 0, 7, 3//下

	// ]);
	var indexes = new this.Uint16Array(nIndexCount);
	var index = 0;
	var start = 0;
	for(var i=0; i<nVertexCountPerSide-1; i++){
		for(var j=0; j<nVertexCountPerSide-1; j++){
			indexes[index++] = start;
			indexes[index++] = start + nVertexCountPerSide;
			indexes[index++] = start + nVertexCountPerSide + 1;
			// indexes[index++] = start;
			// indexes[index++] = start + nVertexCountPerSide + 1;
			// indexes[index++] = start + 1;
			start++;
		}
		start++;
	}
	/*（待添加）创建并初始化一个缓冲区对象(Buffer Object)，用于存顶点坐标*/
	var verticesBufferId = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesBufferId);
	gl.bufferData(gl.ARRAY_BUFFER,
		flatten(vertices),
		gl.STATIC_DRAW);

	/*（待添加）创建并初始化一个缓冲区对象(Buffer Object)，用于存顶点索引序列*/
	var indexesBufferId = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexesBufferId);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
		indexes,
		gl.STATIC_DRAW);
	
	/*加载shader程序并为shader中attribute变量提供数据*/
	// 加载id分别为"vertex-shader"和"fragment-shader"的shader程序，
	// 并进行编译和链接，返回shader程序对象program
    var program = initShaders(gl, "vertex-shader", 
		"fragment-shader");
    gl.useProgram(program);	// 启用该shader程序对象 
	
	/*（待添加）初始化顶点着色器中的顶点位置属性*/
	var a_Position = gl.getAttribLocation(program, "a_Position");
	if(a_Position < 0){
		alert("获取attribute变量a_Position失败");
		return;
	}
	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
	this.gl.enableVertexAttribArray(a_Position);
	/*（待添加）获取shader中uniform变量索引*/
	u_MVPMatrix = gl.getUniformLocation(program, "u_MVPMatrix");
	if(u_MVPMatrix < 0){
		alert("获取uniform变量u_MVPMatrix失败");
		return;
	}
	var u_MinDist = gl.getUniformLocation(program, "u_MinDist");
	if(u_MinDist < 0){
		alert("获取uniform变量u_MinDist失败");
		return;
	}
	var u_MaxDist = gl.getUniformLocation(program, "u_MaxDist");
	if(u_MaxDist < 0){
		alert("获取uniform变量u_MaxDist失败");
		return;
	}
	u_Time = gl.getUniformLocation(program, "u_Time");
	if(u_Time < 0){
		alert("获取uniform变量u_Time失败");
		return;
	}
	gl.uniform1f(u_MinDist, halfSize);
	gl.uniform1f(u_MaxDist, Math.sqrt(3.0)*halfSize);
	/*视域体设置 */
	matProj = ortho(-halfSize*2, halfSize*2,//x范围
		-halfSize*2, halfSize*2,//y范围
		-halfSize*2, halfSize*2);//z范围
	
	//鼠标按键事件监听器
	canvas.onmousedown = function(){
		switch(event.button){
			case 0://鼠标左键
				axis = 0;//绕X轴旋转
				break;
			case 1://鼠标中键
				axis = 1;//绕y轴旋转
				break;
			case 2://鼠标右键
				axis = 2;//绕z轴旋转
				break;
		}
	};
	canvas.oncontextmenu = function(){
		event.preventDefault();
	};
	// 进行绘制
    render();
};

//记录上一次调用函数的时刻
var last = Date.now();
//根据时间更新旋转
function animation(){

	var now = Date.now();
	var elapsed = now - last;
	last = now;
	angle[axis] += delta*elapsed/1000.0;
	angle[axis] %= 360;
	time += elapsed / 1000.0;
	if(time > 2) time -= 2;
	gl.uniform1f(u_Time, time);
}

// 绘制函数
function render() {
	//更新旋转角度
	animation();


	// 清颜色缓存和深度缓存
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   
	//设置模式投影矩阵
	var matMVP = mult(matProj, mult(rotateX(angle[0]),
				mult(rotateY(angle[1]), rotateZ(angle[2]))));
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(matMVP));

	gl.drawElements(gl.TRIANGLES,
				nIndexCount,
				gl.UNSIGNED_SHORT,
				0);
	
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mult(matMVP,rotateX(60))));
	
	var alpha=120;
	for(var i =0; i<6; i++){
		gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mult(matMVP,rotateX(alpha))));
	
		/*待添加绘制代码*/
		gl.drawElements(gl.TRIANGLES,
				nIndexCount,
				gl.UNSIGNED_SHORT,
				0);
		alpha +=60;
	}
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mult(matMVP,rotateY(60))));
	gl.drawElements(gl.TRIANGLES,
		nIndexCount,
		gl.UNSIGNED_SHORT,
		0);

	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mult(matMVP,rotateY(120))));
	gl.drawElements(gl.TRIANGLES,
		nIndexCount,
		gl.UNSIGNED_SHORT,
		0);
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mult(matMVP,rotateY(240))));
	gl.drawElements(gl.TRIANGLES,
		nIndexCount,
		gl.UNSIGNED_SHORT,
		0);
	gl.uniformMatrix4fv(u_MVPMatrix, false, flatten(mult(matMVP,rotateY(300))));
	gl.drawElements(gl.TRIANGLES,
		nIndexCount,
		gl.UNSIGNED_SHORT,
		0);
	
// console.log("ok")
	requestAnimFrame(render);
}
