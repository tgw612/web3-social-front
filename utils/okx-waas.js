import {OKXUniversalProvider} from "@okxconnect/universal-provider";
import CryptoJS from 'crypto-js';
// OKX WaaS服务类
class OKXWaaSService {
  constructor() {
    this.provider = null;
    this.projectId = 'c36a8e923b28a0ad0a77684dfaa1a598'; // 用户在OKX开发者平台创建的项目ID
    this.isInitialized = false;
    this.qrCodeData = null;
    this.qrCodePollingTimer = null;
    this.connectionStatus = 'disconnected'; // disconnected, connecting, connected
    this.walletInfo = null;
    
    // WaaS API配置
    this.apiConfig = {
      apiKey: '', // 需要从环境变量或配置文件获取
      secretKey: '', // 需要从环境变量或配置文件获取
      passphrase: '', // 需要从环境变量或配置文件获取
      baseUrl: 'https://www.okx.com',
      apiVersion: 'v5'
    };
  }

  // 初始化OKX WaaS SDK
  async initialize() {
    try {
      if (this.isInitialized) return true;

      // 创建OKX Universal Provider实例
      this.provider = new UniversalProvider({
        projectId: this.projectId,
        // 可选配置
        networkId: 1, // 默认以太坊主网
        infuraId: '', // 如果使用Infura，可以提供ID
        rpcUrl: '', // 自定义RPC URL
        chainType: 'EVM', // 链类型：EVM或SOL
      });

      // 监听连接事件
      this.provider.on('connect', (info) => {
        console.log('OKX钱包连接成功:', info);
        this.connectionStatus = 'connected';
        this.walletInfo = info;
      });

      // 监听断开连接事件
      this.provider.on('disconnect', () => {
        console.log('OKX钱包断开连接');
        this.connectionStatus = 'disconnected';
        this.walletInfo = null;
      });

      // 监听账户变更事件
      this.provider.on('accountsChanged', (accounts) => {
        console.log('OKX钱包账户变更:', accounts);
        if (accounts.length > 0) {
          this.walletInfo = { ...this.walletInfo, address: accounts[0] };
        }
      });

      // 监听链变更事件
      this.provider.on('chainChanged', (chainId) => {
        console.log('OKX钱包链变更:', chainId);
        if (this.walletInfo) {
          this.walletInfo = { ...this.walletInfo, chainId };
        }
      });

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('初始化OKX WaaS SDK失败:', error);
      return false;
    }
  }

  // 检查是否已安装OKX钱包浏览器插件
  isOKXWalletInstalled() {
    return typeof window !== 'undefined' && !!window.okxwallet;
  }

  // 通过浏览器插件连接OKX钱包
  async connectWithExtension() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.isOKXWalletInstalled()) {
        throw new Error('未安装OKX钱包浏览器插件');
      }

      this.connectionStatus = 'connecting';

      // 请求连接
      const accounts = await this.provider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('用户拒绝连接请求');
      }

      // 获取链ID
      const chainId = await this.provider.request({ method: 'eth_chainId' });
      
      // 获取余额
      const balance = await this.provider.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest']
      });
      
      // 转换余额为ETH单位
      const balanceInEth = parseInt(balance, 16) / 1e18;

      // 构建钱包信息
      this.walletInfo = {
        chainType: 'ethereum',
        walletType: 'OKX',
        address: accounts[0],
        balance: balanceInEth.toString(),
        chainId: parseInt(chainId, 16).toString()
      };

      this.connectionStatus = 'connected';
      
      // 尝试获取OKX账户资产信息
      try {
        if (this.apiConfig.apiKey && this.apiConfig.secretKey && this.apiConfig.passphrase) {
          // 获取账户总估值
          const accountBalance = await this.getAccountBalance();
          
          // 获取资产明细
          const assetDetails = await this.getAssetDetails();
          
          // 将资产信息添加到钱包信息中
          this.walletInfo.okxAssets = {
            totalEquity: accountBalance.totalEquity,
            assetDetails: assetDetails
          };
        }
      } catch (assetError) {
        console.warn('获取OKX资产信息失败，但不影响钱包连接:', assetError);
      }
      
      return this.walletInfo;
    } catch (error) {
      this.connectionStatus = 'disconnected';
      console.error('通过浏览器插件连接OKX钱包失败:', error);
      throw error;
    }
  }

  // 生成OKX钱包扫码登录二维码
  async generateQRCode() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      this.connectionStatus = 'connecting';

      // 生成二维码数据
      const qrCodeData = await this.provider.getQrCode();
      this.qrCodeData = qrCodeData;

      return {
        qrCodeUri: qrCodeData.uri,
        qrCodeId: qrCodeData.id
      };
    } catch (error) {
      this.connectionStatus = 'disconnected';
      console.error('生成OKX钱包二维码失败:', error);
      throw error;
    }
  }

  // 检查二维码扫描状态
  async checkQRCodeStatus() {
    try {
      if (!this.qrCodeData || !this.qrCodeData.id) {
        throw new Error('二维码数据不存在');
      }

      // 检查二维码状态
      const status = await this.provider.checkQrCodeStatus(this.qrCodeData.id);
      
      // 状态说明：
      // pending: 等待扫码
      // scanned: 已扫码，等待确认
      // expired: 已过期
      // confirmed: 已确认
      // rejected: 已拒绝
      console.log('二维码状态:', status);

      if (status === 'confirmed') {
        // 获取钱包信息
        const accounts = await this.provider.request({ method: 'eth_accounts' });
        if (!accounts || accounts.length === 0) {
          throw new Error('获取账户信息失败');
        }

        // 获取链ID
        const chainId = await this.provider.request({ method: 'eth_chainId' });
        
        // 获取余额
        const balance = await this.provider.request({
          method: 'eth_getBalance',
          params: [accounts[0], 'latest']
        });
        
        // 转换余额为ETH单位
        const balanceInEth = parseInt(balance, 16) / 1e18;

        // 构建钱包信息
        this.walletInfo = {
          chainType: 'ethereum',
          walletType: 'OKX',
          address: accounts[0],
          balance: balanceInEth.toString(),
          chainId: parseInt(chainId, 16).toString()
        };

        this.connectionStatus = 'connected';
        return { status, walletInfo: this.walletInfo };
      }

      return { status };
    } catch (error) {
      console.error('检查二维码状态失败:', error);
      throw error;
    }
  }

  // 开始轮询检查二维码状态
  startQRCodePolling(callback, interval = 3000) {
    // 清除可能存在的定时器
    this.clearQRCodePolling();

    // 设置新的定时器
    this.qrCodePollingTimer = setInterval(async () => {
      try {
        const result = await this.checkQRCodeStatus();
        callback(result);

        // 如果已连接或已拒绝，停止轮询
        if (result.status === 'confirmed' || result.status === 'rejected' || result.status === 'expired') {
          this.clearQRCodePolling();
        }
      } catch (error) {
        console.error('轮询检查二维码状态失败:', error);
        callback({ status: 'error', error });
      }
    }, interval);
  }

  // 清除二维码状态轮询定时器
  clearQRCodePolling() {
    if (this.qrCodePollingTimer) {
      clearInterval(this.qrCodePollingTimer);
      this.qrCodePollingTimer = null;
    }
  }

  // 断开钱包连接
  async disconnect() {
    try {
      if (!this.isInitialized) return true;

      // 断开连接
      await this.provider.disconnect();
      
      // 清除状态
      this.connectionStatus = 'disconnected';
      this.walletInfo = null;
      this.clearQRCodePolling();
      
      return true;
    } catch (error) {
      console.error('断开OKX钱包连接失败:', error);
      return false;
    }
  }

  // 签名消息
  async signMessage(message) {
    try {
      if (!this.isInitialized || !this.walletInfo) {
        throw new Error('钱包未连接');
      }

      // 将消息转换为十六进制
      const hexMessage = '0x' + Buffer.from(message).toString('hex');

      // 请求签名
      const signature = await this.provider.request({
        method: 'personal_sign',
        params: [hexMessage, this.walletInfo.address]
      });

      return signature;
    } catch (error) {
      console.error('签名消息失败:', error);
      throw error;
    }
  }

  // 获取当前连接状态
  getConnectionStatus() {
    return this.connectionStatus;
  }

  // 获取当前钱包信息
  getWalletInfo() {
    return this.walletInfo;
  }
  
  // ========== WaaS API 相关方法 ==========
  
  /**
   * 设置API配置
   * @param {Object} config - API配置
   * @param {string} config.apiKey - API密钥
   * @param {string} config.secretKey - API密钥对应的秘钥
   * @param {string} config.passphrase - API密码
   * @param {string} config.baseUrl - API基础URL，默认为https://www.okx.com
   * @returns {boolean} - 设置是否成功
   */
  setApiConfig(config) {
    try {
      // 验证必要的配置项
      if (!config.apiKey || !config.secretKey || !config.passphrase) {
        console.error('API配置不完整，请提供apiKey、secretKey和passphrase');
        return false;
      }
      
      // 更新API配置
      this.apiConfig = { 
        ...this.apiConfig, 
        ...config,
        // 确保baseUrl有默认值
        baseUrl: config.baseUrl || 'https://www.okx.com'
      };
      
      console.log('OKX WaaS API配置已更新');
      return true;
    } catch (error) {
      console.error('设置API配置失败:', error);
      return false;
    }
  }
  
  /**
   * 生成API请求签名
   * @param {string} timestamp - ISO格式的时间戳
   * @param {string} method - 请求方法 GET/POST
   * @param {string} requestPath - 请求路径
   * @param {string} body - 请求体，GET请求为空字符串
   * @returns {string} - 签名
   */
  generateSignature(timestamp, method, requestPath, body = '') {
    // 预处理签名原文
    // 按照OKX API文档要求: timestamp + method + requestPath + body
    const preHash = timestamp + method + requestPath + body;
    
    // 使用HMAC SHA256算法和SecretKey对签名原文进行加密
    const signature = CryptoJS.HmacSHA256(preHash, this.apiConfig.secretKey);
    
    // 对加密结果进行Base64编码
    return CryptoJS.enc.Base64.stringify(signature);
  }
  
  /**
   * 发送API请求
   * @param {string} method - 请求方法 GET/POST
   * @param {string} endpoint - API端点
   * @param {Object} params - 请求参数
   * @returns {Promise<Object>} - 响应结果
   */
  async sendApiRequest(method, endpoint, params = {}) {
    try {
      // 检查API配置是否完整
      if (!this.apiConfig.apiKey || !this.apiConfig.secretKey || !this.apiConfig.passphrase) {
        throw new Error('API配置不完整，请设置apiKey、secretKey和passphrase');
      }
      
      // 构建请求路径 - 使用WaaS API路径
      const requestPath = `/api/${this.apiConfig.apiVersion}/${endpoint}`;
      
      // 生成ISO格式的时间戳
      const timestamp = new Date().toISOString();
      
      // 构建请求体
      let body = '';
      let url = `${this.apiConfig.baseUrl}${requestPath}`;
      
      if (method === 'GET' && Object.keys(params).length > 0) {
        // 对于GET请求，将参数添加到URL中
        const queryString = Object.entries(params)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&');
        url += `?${queryString}`;
      } else if (method === 'POST') {
        // 对于POST请求，将参数添加到请求体中
        body = JSON.stringify(params);
      }
      
      // 生成签名
      const signature = this.generateSignature(timestamp, method, requestPath, body);
      
      // 构建请求头
      const headers = {
        'OK-ACCESS-KEY': this.apiConfig.apiKey,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': this.apiConfig.passphrase,
        'Content-Type': 'application/json',
        // 添加WaaS API所需的额外头部
        'x-simulated-trading': '0' // 0表示真实交易，1表示模拟交易
      };
      
      console.log(`发送${method}请求到: ${url}`);
      
      // 发送请求
      const response = await fetch(url, {
        method,
        headers,
        body: method === 'POST' ? body : undefined
      });
      
      // 解析响应
      const result = await response.json();
      
      console.log('API响应:', result);
      
      // 检查响应状态
      if (result.code === '0') {
        return result.data;
      } else {
        throw new Error(`API请求失败: ${result.msg || '未知错误'} (代码: ${result.code})`);
      }
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取账户总估值
   * @returns {Promise<Object>} - 账户总估值信息
   */
  async getAccountBalance() {
    try {
      // 检查钱包是否已连接
      if (!this.walletInfo || !this.walletInfo.address) {
        throw new Error('钱包未连接');
      }
      
      // 发送API请求获取账户总估值
      // 根据OKX WaaS API文档，使用正确的端点
      const result = await this.sendApiRequest('GET', 'account/balance', {
        // 不需要额外参数，API会返回账户的所有资产
      });
      
      // 处理响应结果
      const totalBalance = {
        totalEquity: '0', // 总权益
        details: result || []
      };
      
      // 从API响应中提取totalEq字段作为总估值
      if (result && result.totalEq) {
        totalBalance.totalEquity = result.totalEq;
      } else if (result && Array.isArray(result.details)) {
        // 如果没有totalEq字段，尝试从details中计算
        totalBalance.totalEquity = result.details.reduce((sum, item) => {
          // 使用eq值（美元等值）计算总权益
          const eqUsd = parseFloat(item.eqUsd || '0');
          return sum + eqUsd;
        }, 0).toFixed(2);
      }
      
      console.log('账户总估值:', totalBalance);
      return totalBalance;
    } catch (error) {
      console.error('获取账户总估值失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取资产明细
   * @param {string} currency - 币种，不传则获取所有币种
   * @returns {Promise<Array>} - 资产明细列表
   */
  async getAssetDetails(currency = '') {
    try {
      // 检查钱包是否已连接
      if (!this.walletInfo || !this.walletInfo.address) {
        throw new Error('钱包未连接');
      }
      
      // 发送API请求获取资产明细
      // 根据OKX WaaS API文档，使用正确的端点
      const result = await this.sendApiRequest('GET', 'asset/balances', {
        ccy: currency // 币种，不传则获取所有币种
      });
      
      // 处理API响应，提取有用的资产信息
      const assetList = [];
      
      if (Array.isArray(result)) {
        // 遍历每个资产，提取关键信息
        result.forEach(asset => {
          if (parseFloat(asset.bal) > 0) { // 只显示有余额的资产
            assetList.push({
              currency: asset.ccy, // 币种
              balance: asset.bal, // 余额
              availableBalance: asset.availBal, // 可用余额
              usdValue: asset.eqUsd, // 美元价值
              frozenBalance: asset.frozenBal || '0', // 冻结余额
            });
          }
        });
      }
      
      console.log('资产明细:', assetList);
      return assetList;
    } catch (error) {
      console.error('获取资产明细失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
const okxWaaSService = new OKXWaaSService();

export default okxWaaSService;