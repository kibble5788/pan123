import Pan123SDK from "../src/index.js";
import dotenv from "dotenv";
import path from "path";

// 加载环境变量
dotenv.config({ path: path.join(process.cwd(), "config.env") });
console.log("--process.env.PAN123_CLIENT_ID", process.env.PAN123_CLIENT_ID);
const sdk = new Pan123SDK({
  clientId: process.env.PAN123_CLIENT_ID,
  clientSecret: process.env.PAN123_CLIENT_SECRET,
});

async function init() {
  await sdk.initToken();
  console.log("获取token");
  let file = "./test/f3.zip";
  //文件上传的文件夹 13821095- 我的文件 >其他
  let parentFileID = "13821095";
  //解压目标文件夹
  let folderId = "13821095";
  //上传m3u8文件

  let res = await sdk.uploadFile(file, {
    parentFileID: parentFileID,
    containDir: false,
    duplicate: 1,
  });
  console.log("上传完成,fileID:", res);

  //解压m3u8文件
  let fileZip = {
    fileId: res.data.fileID,
    folderId: folderId,
  };
  await sdk.zipFile(fileZip);
  console.log("解压完成");

  console.log("---开始测试文件详情接口");
  let fileDetail = await sdk.getFileDetail(res.data.fileID);
  console.log("文件id:", res.data.fileID);
  console.log("文件详情:", fileDetail);

  let directLink = await sdk.enableDirectLink(res.data.fileID);
  console.log("启用直链:", directLink);
}

init();
