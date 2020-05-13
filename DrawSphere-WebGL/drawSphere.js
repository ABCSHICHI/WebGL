// var NumTimesToSubdivide = 0;//递归次数
var update_Points;
var vertices = [//顶点坐标位裁剪坐标系下坐标
        
    ];
var colors = [

];
// points = []; //存放顶点坐标的数组，初始为空

/*旋转角度*/
var xRot = 0.0;
var yRot =0.0;

var gl;			// WebGL上下文
var u_matMVP;	// uniform变量u_matMVP的索引
var matProj;	// 投影矩阵


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
    
    //创造20面体
    for(var i =0;i<5;i++)
        createIcosahedron(i);

    //设置WebGL相关属性  gl.viewport(x，y，width，height）
    gl.viewport(0, // 视口左边界距离canvas左边界距离
                0, // 视口下边界距离canvas下边界距离
                canvas.width, 	// 视口宽度
                canvas.height);	// 视口高度

    gl.clearColor(1.0, 1.0, 1.0, 1.0); // 设置背景色为黑色 gl.clearColor(red,green,blue,alpha)
    gl.enable(gl.DEPTH_TEST);//开启深度检测
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
     gl.vertexAttribPointer(a_Position, 	// shader attribute变量位置
                            3, // 每个顶点属性有3个分量
                            gl.FLOAT, // 数组数据类型(浮点型)
                            false, 	  // 不进行归一化处理
                            Float32Array.BYTES_PER_ELEMENT * 0, // 相邻顶点属性首址间隔
                            0);		  // 第一个顶点属性在Buffer中偏移量为0字节
    gl.enableVertexAttribArray(a_Position);//启动顶点属性数组



    //将顶点颜色属性传递给GPU
    var colorsBufferId = gl.createBuffer();//创建颜色buffer
    gl.bindBuffer(gl.ARRAY_BUFFER,colorsBufferId);//当前id的颜色buffer绑定给当前Arraybuffer
    gl.bufferData(gl.ARRAY_BUFFER,
                flatten(colors),//将数组变成GPU可接受格式
                gl.STATIC_DRAW);//STATIC_DRAW:表明一次提供数据，多次绘制

    //为shader属性变量与buffer数据建立联系
    var a_Color=gl.getAttribLocation(program,"a_Color");
    if(a_Color<0){
        alert("获取attribute变量a_Color失败！");
        return;
    }
    
     // 指定利用当前Array Buffer为a_Position提供数据的具体方式
    gl.vertexAttribPointer(a_Color, 	// shader attribute变量位置
                            3, // 每个顶点属性有3个分量
                            gl.FLOAT, // 数组数据类型(浮点型)
                            false, 	  // 不进行归一化处理
                            Float32Array.BYTES_PER_ELEMENT * 0, // 相邻顶点属性首址间隔
                            Float32Array.BYTES_PER_ELEMENT * 0);// 第一个顶点属性在Buffer中偏移量
    gl.enableVertexAttribArray(a_Color);
    // 获取uniform变量u_matMVP的索引
    u_matMVP = gl.getUniformLocation(program, "u_matMVP");
    if(!u_matMVP){
    alert("获取uniform变量u_matMVP失败！"); 
    return;
    }

    // 设置视域体
    matProj = ortho2D(-1, 1, -1, 1);
    // 添加按键响应
	// window.addEventListener("keydown", myKeyDown, true); 
    
    var pointNum = 0;
    function time(){
        update_Points = pointNum;
        if(pointNum < vertices.length)
            pointNum +=3;
        render(pointNum);//进行绘制
        requestAnimationFrame(time,1000);
    }
   
    time();
     
};



function render(pointNum){

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); //用背景色擦除窗口内容
    //使用顶点数组进行绘制
    // 计算模视投影矩阵
    xRot += 1;
    yRot += 1;
    /*防溢出处理*/
	if(xRot > 356.0)
		xRot = 0.0;
	if(yRot > 356.0)
		yRot = 0.0;
	var matMVP = mult(matProj, mult(rotateX(xRot), rotateY(yRot)));
	// 将矩阵值传给Shader
    gl.uniformMatrix4fv(u_matMVP, false, flatten(matMVP));	
    
    //创建顶点
    gl.drawArrays(gl.TRIANGLE_STRIP,//绘制图元类型为三角扇
        0,//从第0个顶点属性数据开始绘制
        4);//使用4个顶点属性数据
    gl.drawArrays(gl.TRIANGLE_STRIP,//绘制图元类型为三角扇
        4,//从第0个顶点属性数据开始绘制
        4);//使用4个顶点属性数据
    gl.drawArrays(gl.TRIANGLE_STRIP,//绘制图元类型为三角扇
        8,//从第0个顶点属性数据开始绘制
        4);//使用4个顶点属性数据
    //创建面
    gl.drawArrays(gl.TRIANGLES, // 绘制图元类型为三角形
        12, 		// 从第0个顶点属性数据开始绘制
        pointNum);		// 使用顶点个数
    
}
//将三角形的顶点坐标加入数组中
//a,b,c为三角形的三个顶点坐标
function addVertexFrame(a,b,c,d){
    //一个四面体
    var color = vec3(Math.random(),Math.random(),Math.random());
    vertices.push(a);
    colors.push(color);
    vertices.push(b);
    colors.push(color);
    vertices.push(c);
    colors.push(color);
    vertices.push(d);
    colors.push(color);
}
function addVertexFace(a,b,c){
    a = normalizePoint(a);
    b = normalizePoint(b);
    c = normalizePoint(c);
    //一个面
    var color = vec3(Math.random(),Math.random(),Math.random());
    vertices.push(a);
    colors.push(color);
    vertices.push(b);
    colors.push(color);
    vertices.push(c);
    colors.push(color);
}


function createIcosahedron(NumTimesToSubdivide){
    //创建矩形
    var t = (1.0 + Math.sqrt(5.0)) / 4.0;
    addVertexFrame(vec3(-0.5,t,0.0),vec3(0.5,t,0.0),vec3(-0.5,-t,0.0),vec3(0.5,-t,0.0));

    addVertexFrame(vec3(0.0,-0.5,t),vec3(0.0,0.5,t),vec3(0.0,-0.5,-t),vec3(0.0,0.5,-t));

    addVertexFrame(vec3(t,0.0,-0.5),vec3(t,0.0,0.5),vec3(-t,0.0,-0.5),vec3(-t,0.0,0.5));

    
    //创建面
    creatFace(NumTimesToSubdivide);
    
}
function creatFace(NumTimesToSubdivide){
    //点0相邻的面
    divideTriangle(vertices[0],vertices[11],vertices[5],NumTimesToSubdivide);
    divideTriangle(vertices[0],vertices[5],vertices[1],NumTimesToSubdivide);
    divideTriangle(vertices[0],vertices[1],vertices[7],NumTimesToSubdivide);
    divideTriangle(vertices[0],vertices[7],vertices[10],NumTimesToSubdivide);
    divideTriangle(vertices[0],vertices[10],vertices[11],NumTimesToSubdivide);

    //点5相邻的面
    divideTriangle(vertices[1],vertices[5],vertices[9],NumTimesToSubdivide);
    divideTriangle(vertices[5],vertices[11],vertices[4],NumTimesToSubdivide);
    divideTriangle(vertices[11],vertices[10],vertices[2],NumTimesToSubdivide);
    divideTriangle(vertices[10],vertices[7],vertices[6],NumTimesToSubdivide);
    divideTriangle(vertices[7],vertices[1],vertices[8],NumTimesToSubdivide);

    //点3相邻的面
    divideTriangle(vertices[3],vertices[9],vertices[4],NumTimesToSubdivide);
    divideTriangle(vertices[3],vertices[4],vertices[2],NumTimesToSubdivide);
    divideTriangle(vertices[3],vertices[2],vertices[6],NumTimesToSubdivide);
    divideTriangle(vertices[3],vertices[6],vertices[8],NumTimesToSubdivide);
    divideTriangle(vertices[3],vertices[8],vertices[9],NumTimesToSubdivide);

    //点3相邻的面
    divideTriangle(vertices[4],vertices[9],vertices[5],NumTimesToSubdivide);
    divideTriangle(vertices[2],vertices[4],vertices[11],NumTimesToSubdivide);
    divideTriangle(vertices[6],vertices[2],vertices[10],NumTimesToSubdivide);
    divideTriangle(vertices[8],vertices[6],vertices[7],NumTimesToSubdivide);
    divideTriangle(vertices[9],vertices[8],vertices[1],NumTimesToSubdivide);
};


// 递归细分三角形
// a,b,c为三角形三个顶点，k为递归次数
function divideTriangle(a, b, c, k){
    if (k > 0) {	// k > 0则继续细分
        /*计算三角形各边的中点*/
        var ab = mult(0.5, add(a, b));
        var ac = mult(0.5, add(a, c));
        var bc = mult(0.5, add(b, c));
        //归一化球面上
        // ab = normalizePoint(ab);
        // ac = normalizePoint(ac);
        // bc = normalizePoint(bc);
        //细分
        divideTriangle(ab, ac, bc, k - 1);
        divideTriangle(a, ab, ac, k - 1);
        divideTriangle(c, ac, bc, k - 1);
        divideTriangle(b, bc, ab, k - 1);
    }
    else 
        addVertexFace(a, b, c);    // 递归结束时“绘制”三角形
    
}

function normalizePoint(point){
    var r = Math.sqrt(point[0]*point[0] + point[1]*point[1] + point[2]*point[2]);
    return [point[0]/r, point[1]/r, point[2]/r];
}
