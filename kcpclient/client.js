var kcp = require("node-kcp");
var fs = require("fs");
var kcpobj = new kcp.KCP(123, { address: "127.0.0.1", port: 41234 });
var dgram = require("dgram");
var client = dgram.createSocket("udp4");
var msg = "hello world";
var idx = 1;
var interval = 20;

function writeLog(message) {
  let options = {
    flags: "a", //
    encoding: "utf8", // utf8编码
  };
  let stdout = fs.createWriteStream("./yjing.log", options);
  let logger = new console.Console(stdout);
  //logger.log('copying application stagingAppDir = ' + this.stagingAppDir)
  logger.log(message);
}

kcpobj.nodelay(0, interval, 0, 0);

kcpobj.output((data, size, context) => {
  client.send(data, 0, size, context.port, context.address);
});

client.on("error", (err) => {
  console.log(`client error:\n${err.stack}`);
  client.close();
});

client.on("message", (msg, rinfo) => {
  kcpobj.input(msg);
});

setInterval(() => {
  kcpobj.update(Date.now());
  var recv = kcpobj.recv();
  if (recv) {
    console.log(`client recv ${recv}`);
    //kcpobj.send(msg + idx++);
  }
}, interval);
//kcpobj.send(msg + idx++);

// setInterval(() => {
//    console.log("waiting");
// }, 1000*100);
// kcpobj.update(Date.now());
// kcpobj.send(msg + idx++);

const filePath = "E:\\software_installer\\system\\ubuntu-20.04.1-desktop-amd64.iso";
let fileInfo = fs.statSync(filePath);
let fileSize = fileInfo.size;
kcpobj.update(Date.now());
kcpobj.send(
  JSON.stringify({
    id: "client2",
    fileInfo: { fileSize: fileSize, fileName: filePath },
  })
);
console.log("fileSize = " + fileSize);
let sendSize = 0;
let packSize = 1024;
let fd = fs.openSync(filePath, "r");
let buf = new Buffer.alloc(packSize);
console.log("before send fileSize = " + fileSize);
while (sendSize < fileSize) {
  fs.readSync(fd, buf, 0, buf.length, sendSize);
  kcpobj.update(Date.now());
  //console.log('buf length = ' + buf.length);
  let data = buf.toString("hex"); //以十六进制传输
  //console.log(data);
  //writeLog(data);
  //console.log("data = " + data);
  //kcpobj.send("helloworld");
  kcpobj.send(data);
  //console.log("after send");
  sendSize += packSize;
}
