# Web3匿名社交平台 - 前端工程

基于Web3的去中心化社交匿名财富交流平台，支持多链钱包登录、资产展示和社交互动功能。

## 项目简介

本项目是一个基于区块链技术的去中心化社交平台，用户可以通过钱包登录，匿名展示自己的链上资产，并与其他用户进行交流互动。项目支持多端部署（H5、小程序、APP），使用UniApp框架开发，具有良好的兼容性和用户体验。

### 核心特性

1. **钱包登录**：支持多种主流钱包（MetaMask、OKX、Coinbase、Binance等）和多链（ETH、Solana等）登录
2. **资产展示**：完全公开用户链上资产数据，无需隐私化处理
3. **社交功能**：发布动态、评论互动、点赞功能，所有内容永久存储在IPFS或Arweave上
4. **多端支持**：H5网页端、各大小程序、APP原生应用，一套代码多端运行
5. **去中心化存储**：用户资料和内容通过IPFS/Arweave存储，确保永久保存和不可篡改

## 技术架构

### 前端技术栈

- **核心框架**：UniApp
- **状态管理**：Vuex
- **UI组件**：自定义组件
- **数据可视化**：uCharts
- **Web3交互**：
  - ethers.js（以太坊交互）
  - @uni-helper/uni-web3（多端钱包适配）
- **去中心化存储**：
  - IPFS Http Client（文件存储）
  - Arweave（内容永久存储）

### 项目结构

```
web3-social-front/
├── store/                 # Vuex状态管理
│   ├── index.js           # Store主文件
│   └── modules/           # 模块化的Store
│       ├── user.js        # 用户模块
│       ├── assets.js      # 资产模块
│       └── posts.js       # 内容模块
├── pages/                 # 页面文件
│   ├── index/             # 首页
│   ├── login/             # 登录页
│   ├── profile/           # 个人资料页
│   ├── assets/            # 资产展示页
│   ├── post/              # 发布页
│   └── ...                # 其他页面
├── components/            # 公共组件
├── utils/                 # 工具函数
│   ├── api.js             # API服务
│   ├── web3-service.js    # Web3服务
│   └── request.js         # HTTP请求
├── static/                # 静态资源
├── App.vue                # 应用入口组件
├── main.js                # 应用入口文件
├── pages.json             # 页面路由配置
├── manifest.json          # 应用配置
└── package.json           # 项目依赖
```

## 功能模块说明

### 1. 用户身份系统

- **钱包登录**：支持各类主流钱包扫码或授权登录
- **用户资料**：可自定义用户名、头像、昵称等基本信息
- **身份验证**：通过钱包签名验证用户身份

### 2. 资产展示

- **多链资产**：汇总展示用户在不同链上的资产
- **可视化图表**：用饼图、柱状图展示资产分布
- **资产明细**：分类展示代币和NFT资产
- **资产趋势**：显示资产价值随时间变化的趋势

### 3. 社交功能

- **发布动态**：支持文本、图片等多种内容格式
- **互动功能**：评论、点赞、分享
- **永久存储**：所有内容存储在去中心化存储上
- **交易验证**：可关联区块链交易哈希，验证投资真实性

## 快速开始

### 环境要求

- Node.js: v16.x (推荐使用nvm管理Node.js版本)
```bash
# 如果已安装nvm，可以使用以下命令切换到项目所需的Node.js版本
nvm use
```

### 安装

1. 克隆项目
```bash
git clone https://github.com/your-username/web3-social-front.git
cd web3-social-front
```

2. 安装依赖
```bash
npm install
```

### 开发运行

- H5开发
```bash
npm run dev:h5
```

- 微信小程序开发
```bash
npm run dev:mp-weixin
```

- APP开发
```bash
npm run dev:app-plus
```

### 打包构建

- H5打包
```bash
npm run build:h5
```

- 微信小程序打包
```bash
npm run build:mp-weixin
```

- APP打包
```bash
npm run build:app-plus
```

## 部署指南

### H5部署

1. 执行构建命令生成H5版本
```bash
npm run build:h5
```

2. 将生成的`/dist/build/h5`目录下的文件部署到Web服务器

### 小程序部署

1. 执行相应小程序平台的构建命令
```bash
npm run build:mp-weixin  # 微信小程序
```

2. 使用对应小程序开发者工具导入`/dist/build/mp-weixin`目录
3. 在开发者工具中上传代码并提交审核

### APP部署

1. 执行APP构建命令
```bash
npm run build:app-plus
```

2. 使用HBuilderX导入项目，进行云打包或本地打包
3. 生成的安装包可上传至各大应用商店

## 注意事项

1. 在使用前，确保已正确配置相关API地址和密钥
2. 钱包适配需要根据具体平台进行调整
3. 小程序环境下，需要特别注意Web3相关功能的兼容性

## 贡献指南

1. Fork本仓库
2. 创建您的特性分支：`git checkout -b feature/my-feature`
3. 提交您的修改：`git commit -m '添加某某功能'`
4. 推送到分支：`git push origin feature/my-feature`
5. 提交Pull Request

## 许可证

[MIT](LICENSE)

## 联系方式

- 项目维护者: Your Name
- 邮箱: your.email@example.com

---

感谢使用Web3匿名社交平台！欢迎提出问题和建议，共同改进这个项目。