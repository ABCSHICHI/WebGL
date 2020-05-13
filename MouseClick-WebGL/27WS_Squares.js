var MaxNumSquares = 1000;//做多支持正方形数量
var MaxNumVertices = MaxNumSquares*6;//顶点数

var count = 0;//正方形数
var canvas;
var gl;

var drawRect = false;//绘制标志

window.onload = function main(){//onload：决定当前页面加载完成后从哪开始执行程序
    canvas = document.getElementById("webgl");//通过id获取元素canvas
    if(!canvas){
        alert("获取元素失败");
        return;
    }
    gl = WebGLUtils.setupWebGL(canvas);//理解为返回webgl的对象
    if(!gl){
        alert("获得WebGL上下文失败！");
        return;
    }

    //设置WebGL相关属性  gl.viewport(x，y，width，height）
    gl.viewport(0, // 视口左边界距离canvas左边界距离
                0, // 视口下边界距离canvas下边界距离
                canvas.width, 	// 视口宽度
                canvas.height);	// 视口高度

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
                    Float32Array.BYTES_PER_ELEMENT*6*MaxNumVertices,//申请最大空间大小
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
    gl.vertexAttribPointer(a_Position,
        3,
        gl.FLOAT,
        false,
        Float32Array.BYTES_PER_ELEMENT*6,
        0);
    gl.enableVertexAttribArray(a_Position);//启动顶点属性数组


    var a_Color = gl.getAttribLocation(program,"a_Color");
    if(a_Color<0){
        alert("获取attribute变量a_Color失败！");
        return;
    }
    gl.vertexAttribPointer(a_Color,
        3,
        gl.FLOAT,
        false,
        Float32Array.BYTES_PER_ELEMENT*6,
        Float32Array.BYTES_PER_ELEMENT*3);
    gl.enableVertexAttribArray(a_Color);

    var u_matMVP = gl.getUniformLocation(program, "u_matMVP");
    if(u_matMVP<0){
        alert("获取attribute变量u_matMVP失败！");
        return;
    }
    var matProj = ortho2D(0,canvas.width,0,canvas.height);
    gl.uniformMatrix4fv(u_matMVP, false, flatten(matProj));//为uniforn变量传值u_matMVP


    canvas.onclick = function(){
            addSquare(event.clientX, event.clientY);
        }

    //鼠标按下事件
    canvas.onmousedown = function(){
        if(event.button == 0)
            drawRect = true;
    }
    //鼠标弹起事件
    canvas.onmouseup = function(){
        if(event.button == 0)
            drawRect = false;
    }
    
    ////鼠标移动事件
    canvas.onmousemove = function(){
        if(drawRect)
            addSquare(event.clientX, event.clientY);
    }
    // render(gl);//进行绘制
    gl.clear(gl.COLOR_BUFFER_BIT); // 用背景色擦除窗口内容

};

function addSquare(x,y){
    //绘制数目是否已达上限
    if(count >= MaxNumSquares){
        alert("绘制图形数目已经达到上限");
        return;
    }

    //获取canvas在页面坐标系下的矩形
    var rect = canvas.getBoundingClientRect();
    //从页面客户窗口坐标转换为WebGL建模坐标
    x = x - rect.left;
    y = canvas.height - ( y - rect.top);
    var HalfSize = Math.random()*20;
    var vertices = [vec3(x-HalfSize, y+HalfSize, 0),	// 左上
		vec3(x-HalfSize, y-HalfSize, 0),	// 左下
		vec3(x+HalfSize, y-HalfSize, 0),	// 右下
		vec3(x-HalfSize, y+HalfSize, 0),	// 左上
		vec3(x+HalfSize, y-HalfSize, 0),	// 右下
        vec3(x+HalfSize, y+HalfSize, 0)		// 右上
    ];

    var leftTopColor = vec3(Math.random(),Math.random(),Math.random());//左上
    var leftLowColor = vec3(Math.random(),Math.random(),Math.random());//左下
    var rightTopColor = vec3(Math.random(),Math.random(),Math.random());//右上
    var rightLowColor = vec3(Math.random(),Math.random(),Math.random());//右下
    var colors = [
        leftTopColor,
        leftLowColor,
        rightLowColor,
        leftTopColor,
        rightLowColor,
        rightTopColor
    ]
    var data =[];
    for(var i =0; i<6; i++){
        data.push(vertices[i]);
        data.push(colors[i]);
    }
    vertices.length = 0;//清空
    gl.bufferSubData(gl.ARRAY_BUFFER,
        count*6*2*3*Float32Array.BYTES_PER_ELEMENT,//正方形数 * 顶点数 * 顶点元素（2个vec3（颜色和坐标）） * 字节数
        flatten(data));
    data.length =0;
    count++;
    console.log("ok");
    requestAnimFrame(render);
}

function render(){

    gl.clear(gl.COLOR_BUFFER_BIT);//用背景色擦除窗口内容
    //使用顶点数组进行绘制
    gl.drawArrays(gl.TRIANGLES,//绘制图元类型为三角扇
        0,//从第0个顶点属性数据开始绘制
        count*6);//使用4个顶点属性数据
}