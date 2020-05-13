var NumTimesToSubdivide = 10;//递归次数

//随机数据
// var branchAngle = Math.random(0,Math.PI/2);
// var trunkratio = Math.random(0.25,0.75);

//
var branchAngleA;
var branchAngleB;
var trunkratio = 0.32;
var count=0;
var clickCount = 0;
var canvas;
var gl;
points = []; //存放顶点坐标的数组，初始为空
colors = [];
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
    // var vertices = [//顶点坐标位裁剪坐标系下坐标
        
    //     vec3(100,.0,0.0),vec3(100,200,0.0),
    //     ];
    
    // triangle(vertices[0],vertices[1]);
    // console.log(branchAngle);
    // console.log(this.trunkratio);
    //递归初始三角形
    // drawBranches(vertices[0],vertices[1],NumTimesToSubdivide);
    //设置WebGL相关属性  gl.viewport(x，y，width，height）
    gl.viewport(0, // 视口左边界距离canvas左边界距离
                0, // 视口下边界距离canvas下边界距离
                canvas.width, 	// 视口宽度
                canvas.height);	// 视口高度

    gl.clearColor(0.3, 0.3, 0.3, 1.0); // 设置背景色为黑色 gl.clearColor(red,green,blue,alpha)

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
                    Float32Array.BYTES_PER_ELEMENT* 4000*100,//具体数据来源，数组，（不接受js的数组，因为它是对象）这里利用MV.js里的函数转换
                    gl.STATIC_DRAW);//buffer的优化参数
    // vertices.length = 0;
    
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
    gl.vertexAttribPointer(a_Position,3,gl.FLOAT,false,
        Float32Array.BYTES_PER_ELEMENT*6,
        0);
    gl.enableVertexAttribArray(a_Position);//启动顶点属性数组


    //为shader属性变量与buffer数据建立联系
    var a_Color=gl.getAttribLocation(program,"a_Color");
    if(a_Color<0){
        alert("获取attribute变量a_Color失败！");
        return;
    }
    
    gl.vertexAttribPointer(a_Color,3,gl.FLOAT,false,
        Float32Array.BYTES_PER_ELEMENT*6,
        Float32Array.BYTES_PER_ELEMENT*3);
    gl.enableVertexAttribArray(a_Color);
    var u_matMVP = gl.getUniformLocation(program, "u_matMVP");
    if(u_matMVP<0){
        alert("获取attribute变量u_matMVP失败！");
        return;
    }
    
    var matProj = ortho2D(0,canvas.width,0,canvas.height);
    // var matProj = ortho2D(-canvas.width,canvas.width,-canvas.height,canvas.height);
    gl.uniformMatrix4fv(u_matMVP, false, flatten(matProj));//为uniforn变量传值u_matMVP

    // 为canvas添加点击事件监听器
	canvas.onclick = function(){
		addTree(event.clientX, event.clientY);
	};
    points.length = 0;

	gl.clear(gl.COLOR_BUFFER_BIT); // 用背景色擦除窗口内容
    // render();//进行绘制
  

};

function render(){

    gl.clear(gl.COLOR_BUFFER_BIT);//用背景色擦除窗口内容
    //使用顶点数组进行绘制
    gl.drawArrays(gl.LINES,//绘制图元类型为三角扇
        0,//从第0个顶点属性数据开始绘制
        count*2);//使用4个顶点属性数据

}

function addTree(x,y){
    if(clickCount>100){
        alert("数目达到上限制");
        return;
    }
    var rect = canvas.getBoundingClientRect();
    // x = x - rect.left - canvas.width/2;
    // y = canvas.height/2 - ( y - rect.top);
    x = x - rect.left;
    y = canvas.height - ( y - rect.top);
    // console.log(x,y);
    var halfSize = Math.random()*100;
    var vertices = [vec3(x,y,0),vec3(x,y+halfSize,0)];
    // console.log(vertices[0],vertices[1]);
    branchAngleA = Math.random(-Math.PI/2,Math.PI/2);
    branchAngleB = Math.random(-Math.PI/2,Math.PI/2);
    trunkratio = Math.random(0.3,0.4);
    drawBranches(vertices[0],vertices[1],NumTimesToSubdivide);
    vertices.length = 0;
    // console.log(points[0],points[1]);
    //传输数据给GPI
    gl.bufferData(gl.ARRAY_BUFFER,//上一行绑定的buffer
                    flatten(points),//具体数据来源，数组，（不接受js的数组，因为它是对象）这里利用MV.js里的函数转换
                    gl.STATIC_DRAW);//buffer的优化参数
    clickCount++;
   requestAnimFrame(render);//进行绘制               
}

//将三角形的顶点坐标加入数组中
//a,b,c为三角形的三个顶点坐标
function triangle(a,b){
    count++;
    points.push(a);
    points.push(vec3(1.0,0.0,0.0));
    points.push(b);
    points.push(vec3(0.0,1.0,0.0));
}

//递归细分三角形
//k用于控制细分次数
function drawBranches(a,b,k){

    if(k>0){
        var dx= b[0] - a[0];
        var dy= b[1] - a[1];
        var dist = Math.sqrt(dx*dx+dy*dy);
        var angle = Math.atan2(dy,dx);
        var branchLength= dist*(1-trunkratio);
        var pA = mult(0.5,add(a,b));
        var pB =vec3(pA[0] + Math.cos(angle - branchAngleA) * branchLength,
                    pA[1] + Math.sin(angle - branchAngleA) * branchLength,0.0);
        var pC =vec3(pA[0] + Math.cos(angle + branchAngleB) * branchLength,
                    pA[1] + Math.sin(angle + branchAngleB) * branchLength,0.0);
        
        
        triangle(a,pA);
        triangle(pA,mult(0.5,add(pA,pB)));
        triangle(pA,mult(0.5,add(pA,pC)));
        drawBranches(pA,pB,k-1);
        drawBranches(pA,pC,k-1);

        
    }
    else
        return 0;
      
}