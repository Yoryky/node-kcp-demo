var kcp = require("node-kcp");
var dgram = require("dgram");
var fs = require("fs");
var server = dgram.createSocket("udp4");
var clients = {};
var interval = 20;
var fileSize = 0;
var hasSend = 0;
var fileInfo;
let fd = fs.openSync(
  "C:\\Users\\Administrator\\Desktop\\server\\ubuntu-20.04.1-desktop-amd64.iso",
  "w+"
);

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

var output = function (data, size, context) {
  ///console.log('output data = ' + data);
  server.send(data, 0, size, context.port, context.address);
};

server.on("error", (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on("message", (msg, rinfo) => {
  var k = rinfo.address + "_" + rinfo.port;
  if (undefined === clients[k]) {
    var context = {
      address: rinfo.address,
      port: rinfo.port,
    };
    var kcpobj = new kcp.KCP(123, context);
    kcpobj.nodelay(0, interval, 0, 0);
    kcpobj.output(output);
    clients[k] = kcpobj;
  }
  var kcpobj = clients[k];
  kcpobj.input(msg);
  kcpobj.update(Date.now());
  var recv = kcpobj.recv();
  if (recv) {
    if (!fileInfo) {
      console.log('startTime = ' + new Date().getTime());
      fileInfo = JSON.parse(recv).fileInfo;
      //console.log("fileSize = " + fileInfo.fileSize);
      fileSize = fileInfo.fileSize;
    } else {
      hasSend += recv.length;
      //writeLog(recv);
      //console.log("has send  = " + hasSend);
      let pack = recv.slice(0, 2048);
      pack = Buffer.from(pack+'', "hex");
      //console.log('pack length = ' + pack.length);
      //writeLog("" + pack);
      //fs.appendFileSync(fd, pack);
      if (hasSend >= fileSize * 2) {
        let buf = Buffer.from(pack, "hex");
        //fs.appendFileSync(fd, buf);
        //fs.closeSync(fd);
        console.log('endTime = ' + new Date().getTime());
        console.log("file transfer completed");
        hasSend = 0;
        fileInfo = null;
      }
    }
  }
});

server.on("listening", () => {
  var address = server.address();
  console.log(`server listening ${address.address} : ${address.port}`);
  // setInterval(() => {
  //     for (var k in clients) {
  //         var kcpobj = clients[k];
  //     	kcpobj.update(Date.now());
  //     	var recv = kcpobj.recv();
  //     	if (recv) {
  //             console.log(recv);
  //         	//console.log(`server recv ${recv} from ${kcpobj.context().address}:${kcpobj.context().port}`);
  //        		//kcpobj.send('RE-'+recv);
  //    	 	}
  //    	}
  // }, interval);
});

server.bind(41234);
