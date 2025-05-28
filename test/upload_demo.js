import Pan123SDK from "../dist/pan123-sdk.esm";

const sdk = new Pan123SDK({
  clientId: "xxxx",
  clientSecret: "xxxx",
});

async function init() {
  await sdk.initToken();
  console.log("获取token");
  let file = "./f3.zip";
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
}

init();
