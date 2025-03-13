<template>
  <view class="login-container">
    <view class="login-header">
      <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
      <text class="title">Web3匿名社交平台</text>
      <text class="subtitle">基于区块链的去中心化社交应用</text>
    </view>
    
    <view class="login-content">
      <view class="wallet-list">
        <view class="section-title">选择钱包登录</view>
        
        <view 
          class="wallet-item" 
          v-for="wallet in wallets" 
          :key="wallet.name"
          @tap="connectWallet(wallet.type)"
        >
          <image class="wallet-icon" :src="wallet.icon" mode="aspectFit"></image>
          <view class="wallet-info">
            <text class="wallet-name">{{ wallet.name }}</text>
            <text class="wallet-desc">{{ wallet.desc }}</text>
          </view>
          <text class="wallet-action">连接</text>
        </view>
      </view>
      
      <view class="qr-login" v-if="showQRCode">
        <view class="section-title">扫码登录</view>
        <view class="qr-wrapper">
          <canvas class="qr-canvas" canvas-id="qrcode" :style="{ width: '300rpx', height: '300rpx' }"></canvas>
        </view>
        <text class="qr-tip">请使用移动端钱包扫码登录</text>
      </view>
    </view>
    
    <view class="login-footer">
      <view class="info-text">
        <text>登录即表示您同意我们的</text>
        <text class="link">服务条款</text>
        <text>和</text>
        <text class="link">隐私政策</text>
      </view>
      
      <view class="web3-features">
        <view class="feature-item">
          <text class="feature-icon">🔒</text>
          <text class="feature-text">私钥永不离开设备</text>
        </view>
        <view class="feature-item">
          <text class="feature-icon">🌐</text>
          <text class="feature-text">去中心化账户</text>
        </view>
        <view class="feature-item">
          <text class="feature-icon">🔐</text>
          <text class="feature-text">安全可靠</text>
        </view>
      </view>
    </view>
    
    <view class="loading-modal" v-if="isConnecting">
      <view class="loading-content">
        <view class="spinner"></view>
        <text class="loading-text">正在连接钱包...</text>
      </view>
    </view>
  </view>
</template>

<script>
import QRCode from 'qrcode'

export default {
  data() {
    return {
      wallets: [
        {
          name: 'MetaMask',
          type: 'MetaMask',
          icon: '/static/wallets/metamask.png',
          desc: '最流行的以太坊钱包'
        },
        {
          name: 'OKX钱包',
          type: 'OKX',
          icon: '/static/wallets/okx.png',
          desc: '多链钱包，支持以太坊、BSC等'
        },
        {
          name: 'Coinbase钱包',
          type: 'Coinbase',
          icon: '/static/wallets/coinbase.png',
          desc: '安全易用的Web3钱包'
        },
        {
          name: 'Binance钱包',
          type: 'Binance',
          icon: '/static/wallets/binance.png',
          desc: '币安交易所官方钱包'
        }
      ],
      isConnecting: false,
      showQRCode: false,
      qrValue: '',
      connectionSession: null
    }
  },
  onLoad() {
    // 检查是否已登录
    const walletInfo = uni.getStorageSync('walletInfo')
    if (walletInfo) {
      this.checkWalletAndRedirect()
    }
    
    // 判断是否需要显示二维码
    // #ifdef H5
    this.showQRCode = false
    // #endif
    
    // #ifdef APP-PLUS || MP
    this.showQRCode = true
    this.generateQRCode()
    // #endif
  },
  methods: {
    async checkWalletAndRedirect() {
      try {
        const isConnected = await this.$web3Service.checkConnection()
        if (isConnected) {
          uni.switchTab({
            url: '/pages/index/index'
          })
        }
      } catch (error) {
        console.error('检查钱包连接失败', error)
      }
    },
    
    async connectWallet(walletType) {
      try {
        this.isConnecting = true
        
        // 使用Web3服务连接钱包
        const result = await this.$web3Service.connectWallet(walletType)
        
        if (result.success) {
          // 使用Vuex存储钱包信息
          await this.$store.dispatch('user/loginWithWallet', {
            address: result.address,
            chainId: result.chainId,
            walletType: walletType
          })
          
          uni.showToast({
            title: '钱包连接成功',
            icon: 'success'
          })
          
          // 跳转到首页
          setTimeout(() => {
            uni.switchTab({
              url: '/pages/index/index'
            })
          }, 1000)
        } else {
          throw new Error(result.error || '连接失败')
        }
      } catch (error) {
        console.error('连接钱包失败', error)
        uni.showToast({
          title: error.message || '连接失败，请重试',
          icon: 'none'
        })
      } finally {
        this.isConnecting = false
      }
    },
    
    async generateQRCode() {
      try {
        // 生成随机会话ID
        const sessionId = Math.random().toString(36).substring(2, 15)
        this.connectionSession = sessionId
        
        // 生成二维码数据
        this.qrValue = `web3social://wallet-connect?session=${sessionId}`
        
        // 创建二维码
        await this.$nextTick()
        QRCode.toCanvas(uni.createSelectorQuery().select('.qr-canvas').node(), this.qrValue, {
          width: 200,
          margin: 2,
          color: {
            dark: '#1890ff',
            light: '#ffffff'
          }
        })
        
        // 模拟监听会话
        this.startSessionListener()
      } catch (error) {
        console.error('生成二维码失败', error)
      }
    },
    
    // 监听二维码扫描会话
    startSessionListener() {
      // 实际项目中，这里应该通过WebSocket或轮询API来监听扫码状态
      // 这里仅作为示例，使用定时器模拟
      this.sessionTimer = setInterval(() => {
        // 检查会话状态
        this.checkSessionStatus()
      }, 3000)
    },
    
    // 检查会话状态
    checkSessionStatus() {
      // 模拟API调用
      // 实际项目中，应该调用后端API检查会话状态
      console.log('检查扫码状态...')
      
      // 清除定时器，防止内存泄漏
      clearInterval(this.sessionTimer)
    }
  },
  onUnload() {
    // 清除定时器
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer)
    }
  }
}
</script>

<style>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa, #e4e8f0);
  padding: 40rpx 30rpx;
  display: flex;
  flex-direction: column;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
  padding-top: 60rpx;
}

.logo {
  width: 150rpx;
  height: 150rpx;
  margin-bottom: 30rpx;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #666;
}

.login-content {
  flex: 1;
  background-color: #fff;
  border-radius: 24rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 40rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 30rpx;
}

.wallet-list {
  margin-bottom: 40rpx;
}

.wallet-item {
  display: flex;
  align-items: center;
  padding: 30rpx 20rpx;
  border-bottom: 1px solid #f0f0f0;
}

.wallet-icon {
  width: 80rpx;
  height: 80rpx;
  margin-right: 20rpx;
}

.wallet-info {
  flex: 1;
}

.wallet-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.wallet-desc {
  font-size: 24rpx;
  color: #999;
}

.wallet-action {
  font-size: 28rpx;
  color: #1890ff;
  background-color: rgba(24, 144, 255, 0.1);
  padding: 8rpx 20rpx;
  border-radius: 30rpx;
}

.qr-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx;
}

.qr-wrapper {
  background-color: #fff;
  padding: 20rpx;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 20rpx;
}

.qr-canvas {
  width: 300rpx;
  height: 300rpx;
}

.qr-tip {
  font-size: 26rpx;
  color: #666;
}

.login-footer {
  padding: 30rpx 0;
}

.info-text {
  text-align: center;
  font-size: 26rpx;
  color: #999;
  margin-bottom: 30rpx;
}

.link {
  color: #1890ff;
  margin: 0 6rpx;
}

.web3-features {
  display: flex;
  justify-content: space-around;
  margin-top: 20rpx;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.feature-icon {
  font-size: 44rpx;
  margin-bottom: 10rpx;
}

.feature-text {
  font-size: 24rpx;
  color: #666;
}

.loading-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-content {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #333;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 