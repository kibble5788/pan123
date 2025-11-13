import Pan123SDK from '../dist/index.esm.js';
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量（仅在本地存在 config.env 时使用）
const localEnvPath = join(__dirname, '../config.env');
if (existsSync(localEnvPath)) {
    config({ path: localEnvPath });
    console.log('Loaded local env from', localEnvPath);
} else {
    console.log('No local config.env found; relying on process.env (CI should inject secrets).');
}

// 在继续之前校验必须的环境变量，尽早失败并给出可操作的提示
const _requiredEnv = ['PAN123_CLIENT_ID', 'PAN123_CLIENT_SECRET', 'PAN123_BASE_URL'];
const _missing = _requiredEnv.filter(k => !process.env[k]);
if (_missing.length) {
    console.error('\n❌ 缺少必需的环境变量：', _missing.join(', '));
    console.error('请在 GitHub 仓库 Secrets 中添加这些变量，或在本地创建 config.env 并填入对应的键值。');
    process.exit(1);
}

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

        // 不再显式调用 initToken，首次鉴权调用会自动初始化并缓存令牌
        console.log('\n📝 令牌初始化将由首次鉴权的 API 调用自动触发');

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

        // 测试离线下载（创建任务）
        console.log('\n⬇️ 测试创建离线下载任务...');
        const offlineUrl = 'http://m701.music.126.net/20251107010546/fe8baa1b75a87be638c00cfed631a60b/jdymusic/obj/w5zDlMODwrDDiGjCn8Ky/1497780933/89ac/10f1/f3ff/9589a9750b9c0ce7868f74d4ac789f64.mp3?vuutv=cMTUh9yl1Y6xgBgUftxm9hQUpr/n9s0iuHJZafnZj2w63Su0G7hPhDk1KREHaLoilOfT5hmMpYBtsiNYH3fgtL11pJnTC3FfvOY4XOcXgGc=';
        try {
            // 使用 SDK 的 file 服务创建离线下载任务
            const offlineResult = await sdk.file.createOfflineDownload({
                url: offlineUrl,
                fileName: 'test_offline.mp3'
            });
            console.log('✅ 离线下载任务创建结果:', offlineResult);
        } catch (err) {
            console.error('❌ 创建离线下载任务失败:', err && err.message ? err.message : err);
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