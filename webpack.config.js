import path from "path";
import { fileURLToPath } from "url";
import { merge } from "webpack-merge";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 自定义插件：复制类型定义文件
class CopyTypesPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap("CopyTypesPlugin", () => {
      const srcPath = path.resolve(__dirname, "src/index.d.ts");
      const distPath = path.resolve(__dirname, "dist/index.d.ts");

      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, distPath);
        console.log("类型定义文件已复制到 dist 目录");
      }
    });
  }
}

const baseConfig = {
  entry: "./src/index.js",
  plugins: [new CopyTypesPlugin()],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            plugins: [
              // 在生产环境下移除 console.log
              process.env.NODE_ENV === "production" &&
                "transform-remove-console",
            ].filter(Boolean),
          },
        },
      },
    ],
  },
  resolve: {
    fallback: {
      fs: false,
      path: false,
      crypto: false,
    },
  },
};

const cjsConfig = {
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "pan123-sdk.cjs",
    library: {
      name: "Pan123SDK",
      type: "commonjs2",
      export: "default",
    },
    globalObject: "this",
  },
  target: "node",
  externals: {
    fs: "commonjs fs",
    path: "commonjs path",
    crypto: "commonjs crypto",
  },
};

const esmConfig = {
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "pan123-sdk.esm.js",
    library: {
      type: "module",
    },
  },
  experiments: {
    outputModule: true,
  },
  target: "web",
  resolve: {
    fallback: {
      fs: false,
      path: false,
      crypto: false,
      buffer: false,
      stream: false,
      util: false,
    },
  },
};

export default [merge(baseConfig, cjsConfig), merge(baseConfig, esmConfig)];
