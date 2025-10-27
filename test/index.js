import Pan123SDK from '../dist/index.esm.js';
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
config({ path: join(__dirname, '../config.env') });

async function runTests() {
    console.log('🚀 开始测试 Pan123SDK v2...\n');

    try {
        // 初始化SDK
        const sdk = new Pan123SDK({
            clientId: process.env.PAN123_CLIENT_ID,
            clientSecret: process.env.PAN123_CLIENT_SECRET,
            baseURL: process.env.PAN123_BASE_URL
        });

        console.log('✅ SDK初始化成功');

        // 测试获取访问令牌
        console.log('\n📝 测试获取访问令牌...');
        const tokenResult = await sdk.initToken();
        console.log('✅ 获取访问令牌成功:', tokenResult ? '已获取' : '失败');

        // 测试获取文件列表
        console.log('\n📂 测试获取文件列表...');
        const fileListResult = await sdk.getFileList({ parentFileId: 0 });
        console.log('✅ 获取文件列表成功，文件数量:', fileListResult.data?.fileList?.length || 0);

        // 测试文件上传（如果测试文件存在）
        const testFilePath = join(__dirname, 'f3.zip');
        if (existsSync(testFilePath)) {
            console.log('\n📤 测试文件上传...');
            const uploadResult = await sdk.uploadFile(testFilePath, {
                parentFileID: 0,
                duplicate: 1
            });
            console.log('✅ 文件上传成功:', uploadResult.success ? `成功: ${uploadResult.message}` : `失败: ${uploadResult.message}`);
        } else {
            console.log('\n⚠️  跳过文件上传测试（测试文件不存在）');
        }

        console.log('\n🎉 所有测试完成！');

    } catch (error) {
        console.error('\n❌ 测试失败:', error.message);
        if (error.response?.data) {
            console.error('API响应:', error.response.data);
        }
        process.exit(1);
    }
}

runTests();