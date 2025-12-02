/**
 * 使用示例 - 展示 SDK 2.0 的新使用模式
 * 
 * 使用前请先安装依赖：npm install
 * 然后构建项目：npm run build
 * 
 * SDK 2.0 的主要变化：
 * 1. 所有方法返回 ApiResponse<T> 结构（包含 code、message、data）
 * 2. API 错误不再抛出异常，而是通过 code 字段表示
 * 3. 提供 isSuccess 和 extractData 辅助函数简化错误处理
 */

const { Pan123SDK, isSuccess, extractData } = require('./dist/index.js');

async function main() {
  // 初始化 SDK
  const sdk = new Pan123SDK({
    clientId: '9f564c9309fe4e1ca2c8ccc2042ce5d8',
    clientSecret: 'e592f5650db44485a923e4762172531e',
    debug: true
  });

  try {
    // ========================================
    // 示例 1: 获取根目录文件列表
    // ========================================
    console.log('\n=== 示例 1: 获取文件列表 ===');
    const listResponse = await sdk.getFileList(0, 20);
    
    // 方式 1: 直接检查 code 字段
    if (listResponse.code === 0) {
      console.log('✓ 获取成功');
      console.log('  文件数量:', listResponse.data.fileList.length);
      console.log('  最后文件 ID:', listResponse.data.lastFileId);
    } else {
      console.error('✗ 获取失败');
      console.error('  错误代码:', listResponse.code);
      console.error('  错误信息:', listResponse.message);
      if (listResponse['x-traceID']) {
        console.error('  追踪 ID:', listResponse['x-traceID']);
      }
    }

    // ========================================
    // 示例 2: 创建文件夹（使用 isSuccess 辅助函数）
    // ========================================
    console.log('\n=== 示例 2: 创建文件夹 ===');
    const folderName = '测试文件夹_' + Date.now();
    const folderResponse = await sdk.createFolder(folderName, 0);
    
    // 方式 2: 使用 isSuccess 辅助函数
    if (isSuccess(folderResponse)) {
      console.log('✓ 文件夹创建成功');
      console.log('  文件夹 ID:', folderResponse.data.dirID);
    } else {
      console.error('✗ 文件夹创建失败');
      console.error('  错误代码:', folderResponse.code);
      console.error('  错误信息:', folderResponse.message);
      return; // 创建失败，后续操作无法继续
    }

    const folderId = folderResponse.data.dirID;

    // ========================================
    // 示例 3: 搜索文件（使用 extractData 辅助函数）
    // ========================================
    console.log('\n=== 示例 3: 搜索文件 ===');
    const searchResponse = await sdk.searchFiles('测试', 0, 10);
    
    // 方式 3: 使用 extractData 辅助函数
    const searchData = extractData(searchResponse);
    if (searchData) {
      console.log('✓ 搜索成功');
      console.log('  搜索结果数量:', searchData.fileList.length);
      if (searchData.fileList.length > 0) {
        console.log('  第一个文件:', searchData.fileList[0].filename);
      }
    } else {
      console.error('✗ 搜索失败');
      console.error('  错误信息:', searchResponse.message);
    }

    // ========================================
    // 示例 4: 重命名文件夹
    // ========================================
    console.log('\n=== 示例 4: 重命名文件夹 ===');
    const newName = '新名称_' + Date.now();
    const renameResponse = await sdk.renameFile(folderId, newName);
    
    if (isSuccess(renameResponse)) {
      console.log('✓ 重命名成功');
      console.log('  新名称:', newName);
    } else {
      console.error('✗ 重命名失败');
      console.error('  错误信息:', renameResponse.message);
    }

    // ========================================
    // 示例 5: 删除文件夹到回收站
    // ========================================
    console.log('\n=== 示例 5: 删除文件夹到回收站 ===');
    // const trashResponse = await sdk.trashFiles([folderId]);
    
    // if (isSuccess(trashResponse)) {
    //   console.log('✓ 删除成功');
    // } else {
    //   console.error('✗ 删除失败');
    //   console.error('  错误信息:', trashResponse.message);
    // }

    // ========================================
    // 示例 6: 批量删除（展示输入验证错误）
    // ========================================
    console.log('\n=== 示例 6: 批量删除（输入验证） ===');
    try {
      // 尝试删除超过 100 个文件（会抛出输入验证异常）
      const tooManyIds = Array.from({ length: 101 }, (_, i) => i + 1);
      await sdk.trashFiles(tooManyIds);
    } catch (error) {
      console.error('✗ 输入验证失败（预期行为）');
      console.error('  错误信息:', error.message);
    }

    // ========================================
    // 示例 7: 上传文件（需要准备一个测试文件）
    // ========================================
    console.log('\n=== 示例 7: 上传文件 ===');
    console.log('提示: 取消注释下面的代码并准备一个测试文件来测试上传功能');
    
    
    const uploadResponse = await sdk.uploadFile('./test.txt',folderId, '测试文件.txt', 1);
    
    if (isSuccess(uploadResponse)) {
      console.log('✓ 文件上传成功');
      
      // 判断是秒传还是分片上传
      if (uploadResponse.data.reuse) {
        console.log('  上传方式: 秒传');
        console.log('  文件 ID:', uploadResponse.data.fileID);
      } else if (uploadResponse.data.completed) {
        console.log('  上传方式: 分片上传');
        console.log('  文件 ID:', uploadResponse.data.fileID);
      }
    } else {
      console.error('✗ 文件上传失败');
      console.error('  错误代码:', uploadResponse.code);
      console.error('  错误信息:', uploadResponse.message);
      if (uploadResponse['x-traceID']) {
        console.error('  追踪 ID:', uploadResponse['x-traceID']);
      }
    }
   


    



  } catch (error) {
    // 捕获网络错误或输入验证错误
    console.error('\n✗ 发生异常（网络错误或输入验证错误）:');
    console.error('  错误信息:', error.message);
    console.error('  错误堆栈:', error.stack);
  }
}

// 运行示例
main();
