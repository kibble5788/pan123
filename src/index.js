import Request from "./core/request.js";
import FileService from "./services/file.js";
import { API_ENDPOINTS, API_BASE_URL_WEB } from "./core/constants.js";
import fs from "fs";
import path from "path";
import { getParamKey, isTokenValid } from "./core/utils.js";

export default class Pan123SDK {
  constructor(config) {
    if (!config.clientId || !config.clientSecret) {
      throw new Error("clientId 和 clientSecret 是必须的");
    }

    this.config = config;
    this.request = new Request(config);

    // token相关属性
    this.tokenCache = {
      accessToken: "",
      expiresIn: 0,
      tokenTime: 0,
    };

    // 初始化各个服务
    this.file = new FileService(this.request);
  }

  // 获取access token
  async initToken() {
    // 检查token是否过期
    if (isTokenValid(this.tokenCache)) {
      return this.tokenCache.accessToken;
    }

    try {
      const { data: response } = await this.request.request({
        url: API_ENDPOINTS.ACCESS_TOKEN,
        method: "POST",
        data: {
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        },
      });

      // 缓存token信息
      this.tokenCache = {
        accessToken: response.accessToken,
        expiresIn: response.expiredAt,
        tokenTime: Date.now(),
      };
      // 设置到request实例中
      this.request.accessToken = response.accessToken;
      return response.accessToken;
    } catch (error) {
      throw new Error(
        `获取access token失败，请检查clientId 和 clientSecret是否正确`
      );
    }
  }

  /**
   * 完整的文件上传流程
   * @param {string} filePath 文件本地路径
   * @param {Object} options 上传选项
   * @param {number} options.parentFileID 父目录ID
   * @param {boolean} [options.containDir=false] 是否包含路径
   * @param {number} [options.duplicate=1] 重名策略
   * @returns {Promise<Object>} 上传结果
   */
  async uploadFile(filePath, options) {
    try {
      // 获取文件信息
      const fileStats = fs.statSync(filePath);

      const fileName = path.basename(filePath);
      const fileInfo = new File([fs.readFileSync(filePath)], fileName, {
        type: "application/octet-stream",
      });

      // 计算MD5
      console.log("开始计算MD5");
      const etag = await this.file.calculateFileMD5FromPath(filePath);

      console.log("开始创建文件");

      // 1. 创建文件
      const { data: createResult } = await this.file.createFile({
        parentFileID: options.parentFileID || 0,
        filename: options.containDir
          ? filePath.replace(/\\/g, "/").split("/").slice(-2).join("/") // 取最后两级路径作为相对路径
          : fileName,
        etag,
        size: fileStats.size,
        duplicate: options.duplicate || 1,
        containDir: options.containDir || false,
      });

      console.log("判断是否秒传成功", createResult);

      // 判断是否秒传成功
      if (createResult.reuse === true) {
        return {
          success: true,
          data: createResult,
          message: "文件秒传成功",
        };
      }

      // 非秒传，继续上传流程
      const { preuploadID, sliceSize } = createResult;

      // 文件分片
      const chunks = this.file.sliceFile(fileInfo, sliceSize);
      const totalChunks = chunks.length;
      console.log("分片数量:", totalChunks);

      if (totalChunks === 0) {
        return {
          success: false,
          data: { filePath, sliceSize },
          message: "分片失败,分片数量=0",
        };
      }

      // 上传所有分片
      for (let i = 0; i < totalChunks; i++) {
        const sliceNo = i + 1; // 分片序号从1开始

        // 2. 获取上传地址
        const { data: urlResult } = await this.file.getUploadUrl(
          preuploadID,
          sliceNo
        );
        console.log("获取上传地址", urlResult.presignedURL);

        // 3. 上传分片
        await this.file.uploadChunk(urlResult.presignedURL, chunks[i]);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // 4. 文件比对（非必需，但建议执行）
      if (fileStats.size > sliceSize) {
        const chunksResult = await this.file.listUploadedChunks(preuploadID);
        // 在这里可以比对本地与云端的分片MD5
      }

      // 5. 上传完成
      const { data: completeResult } = await this.file.completeUpload(
        preuploadID
      );
      console.log("上传完成", completeResult);

      // 判断是否需要异步轮询
      if (completeResult.async === true) {
        // 6. 轮询获取结果
        const finalResult = await this.file.pollUploadResult(preuploadID);

        return {
          success: true,
          data: finalResult,
          message: "文件上传成功",
        };
      } else {
        return {
          success: true,
          data: completeResult,
          message: "文件上传成功",
        };
      }
    } catch (error) {
      console.log("error", error);

      return {
        success: false,
        message: error.message || "文件上传失败",
        error,
      };
    }
  }
  /**
   * 解压
   * @param {string} fileId 文件ID
   * @param {string} folderId 目标文件夹ID
   * @returns {Promise<Object>} 解压结果
   */
  async zipFile({ fileId, folderId } = data) {
    let tk = new Date().valueOf();
    //创建解压任务
    let res = await this.request.request({
      baseURL: API_BASE_URL_WEB,
      url: API_ENDPOINTS.UNCOMPRESS,
      method: "GET",
      params: {
        fileId,
        password: "",
        [tk]: getParamKey(tk),
      },
    });

    //轮询解压状态
    let taskId = res.data.taskId;

    let status = 0;
    let fileInfo = {};
    const getStatus = async () => {
      let { data: statusInfo } = await this.request.request({
        baseURL: API_BASE_URL_WEB,
        url: API_ENDPOINTS.UNCOMPRESS_STATUS,
        method: "GET",
        params: {
          fileId,
          taskId: taskId,
          taskType: 1,
          [tk]: getParamKey(tk),
        },
      });
      if (statusInfo.state === 2) {
        console.log("解压成功");
        status = 2;
        fileInfo = statusInfo;
      } else {
        console.log("正在打开压缩包");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await getStatus();
      }
    };
    await getStatus();
    //解压到目标文件夹
    let res2 = await this.request.request({
      baseURL: API_BASE_URL_WEB,
      url: `${API_ENDPOINTS.UNCOMPRESS_DOWNLOAD}?${tk}=${getParamKey(tk)}`,
      method: "POST",
      data: {
        fileId: fileId,
        list: fileInfo.list,
        password: "",
        targetFileId: folderId,
        taskId: taskId,
      },
    });
    console.log("解压中", res2);

    const getStatus2 = async () => {
      let { data: statusInfo } = await this.request.request({
        baseURL: API_BASE_URL_WEB,
        url: API_ENDPOINTS.UNCOMPRESS_STATUS,
        method: "GET",
        params: {
          fileId,
          taskId: taskId,
          taskType: 2,
          [tk]: getParamKey(tk),
        },
      });
      if (statusInfo.state === 2) {
        console.log("解压成功2");
      } else {
        console.log("解压状态：", statusInfo.state);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await getStatus2();
      }
    };
    await getStatus2();
  }
  /**
   * 获取文件列表（推荐）
   * @param {Object} params 参数
   * @param {number} params.parentFileId 父文件夹ID
   * @param {number} params.limit 每页数量
   * @param {string} params.searchData 搜索内容
   * @param {number} params.searchMode 搜索模式
   * @param {number} params.lastFileId 最后文件ID
   */
  async getFileList({
    parentFileId = 0,
    limit = 100,
    searchData = "",
    searchMode = 0,
    lastFileId = 0,
  } = params) {
    let res = await this.request.request({
      url: API_ENDPOINTS.FILE_LIST,
      method: "GET",
      params: {
        parentFileId,
        limit,
        searchData,
        searchMode,
        lastFileId,
      },
    });
    return {
      success: true,
      data: res.data,
      message: "",
    };
  }
  /**
   * 获取单个文件详情
   */
  async getFileDetail(fileID) {
    try {
      let res = await this.request.request({
        url: API_ENDPOINTS.FILE_DETAIL,
        method: "GET",
        params: { fileID },
      });
      return {
        success: true,
        data: res.data,
        message: "",
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }
  /**
   * 获取文件下载链接
   * @param {string} fileId 文件ID
   * @returns {Promise<Object>} 下载链接
   */
  async getFileDownloadUrl({ fileId }) {
    try {
      let res = await this.request.request({
        url: API_ENDPOINTS.FILE_DOWNLOAD_URL,
        method: "GET",
        params: { fileId },
      });

      return {
        success: true,
        data: res.data,
        message: "",
      };
    } catch (error) {
      throw new Error(`获取文件下载链接失败: ${error.message}`);
    }
  }
  /**
   * 单个文件重命名
   * @param {string} fileId 文件ID
   * @param {string} fileName 新文件名
   * @returns {Promise<Object>} 重命名结果
   */
  async resetFileName({ fileId, fileName }) {
    let res = await this.request.request({
      url: API_ENDPOINTS.FILE_RENAME,
      method: "PUT",
      data: { fileId, fileName },
    });
    return res;
  }
  /**
   * 文件删除,
   * @param {array} fileIDs 文件id数组, 一次性最大不能超过 100 个文件
   * @returns {Promise<Object>} 删除结果
   */
  async trashFile({ fileIDs }) {
    let res = await this.request.request({
      url: API_ENDPOINTS.FILE_DELETE,
      method: "POST",
      data: { fileIDs },
    });
    return res;
  }
  /**
   * 启用直链
   * @param {string} fileID 文件夹的fileID
   * @returns {Promise<Object>} 启用直链结果
   */
  async enableDirectLink(fileID) {
    let res = await this.request.request({
      url: API_ENDPOINTS.ENABLE_DIRECT_LINK,
      method: "POST",
      data: { fileID },
    });
    return res;
  }
  /**
   * 禁用直链
   * @param {string} 文件夹的fileID
   * @returns {Promise<Object>} 禁用直链结果
   */
  async disableDirectLink(fileID) {
    let res = await this.request.request({
      url: API_ENDPOINTS.DISABLE_DIRECT_LINK,
      method: "POST",
      data: { fileID },
    });
    return res;
  }
  /**
   * 获取直链链接
   */
  async getFileDirectLink(fileID) {
    let res = await this.request.request({
      url: API_ENDPOINTS.FILE_DIRECT_LINK,
      method: "GET",
      params: { fileID },
    });
    return res;
  }
}

// 兼容 CommonJS 和 ES Module
if (typeof module !== "undefined" && module.exports) {
  module.exports = Pan123SDK;
  module.exports.default = Pan123SDK;
}
