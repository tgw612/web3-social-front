<template>
  <view class="wallet-connector">
    <view class="connector-header">
      <text class="title">连接钱包</text>
      <text class="subtitle">选择您要连接的钱包类型</text>
    </view>
    
    <view class="network-tabs">
      <view 
        class="network-tab" 
        :class="{ active: activeNetwork === 'ethereum' }"
        @click="activeNetwork = 'ethereum'"
      >
        <image class="network-icon" src="/static/icons/ethereum.png" mode="aspectFit"></image>
        <text>以太坊</text>
      </view>
      
      <view 
        class="network-tab" 
        :class="{ active: activeNetwork === 'solana' }"
        @click="activeNetwork = 'solana'"
      >
        <image class="network-icon" src="/static/icons/solana.png" mode="aspectFit"></image>
        <text>Solana</text>
      </view>
    </view>
    
    <view class="wallet-list">
      <!-- 以太坊钱包 -->
      <view v-if="activeNetwork === 'ethereum'">
        <view 
          class="wallet-item" 
          v-for="wallet in ethereumWallets" 
          :key="wallet.type"
          @click="connectWallet(wallet.type)"
        >
          <image class="wallet-logo" :src="wallet.logo" mode="aspectFit"></image>
          <view class="wallet-info">
            <text class="wallet-name">{{ wallet.name }}</text>
            <text class="wallet-desc">{{ wallet.description }}</text>
          </view>
          <uni-icons type="right" size="18"></uni-icons>
        </view>
      </view>
      
      <!-- Solana钱包 -->
      <view v-if="activeNetwork === 'solana'">
        <view 
          class="wallet-item" 
          v-for="wallet in solanaWallets" 
          :key="wallet.type"
          @click="connectWallet(wallet.type)"
        >
          <image class="wallet-logo" :src="wallet.logo" mode="aspectFit"></image>
          <view class="wallet-info">
            <text class="wallet-name">{{ wallet.name }}</text>
            <text class="wallet-desc">{{ wallet.description }}</text>
          </view>
          <uni-icons type="right" size="18"></uni-icons>
        </view>
      </view>
    </view>
    
    <view class="connector-footer">
      <text class="help-text">连接钱包后，您将可以使用社区功能并查看您的资产</text>
    </view>
    
    <!-- 连接中状态 -->
    <uni-popup ref="connectingPopup" type="center">
      <view class="connecting-popup">
        <uni-load-more status="loading" :contentText="{ contentrefresh: '连接中...' }"></uni-load-more>
        <text class="popup-text">正在连接钱包，请在钱包中确认</text>
      </view>
    </uni-popup>
    
    <!-- 错误提示 -->
    <uni-popup ref="errorPopup" type="center">
      <view class="error-popup">
        <uni-icons type="close-circle" color="#ff4d4f" size="30"></uni-icons>
        <text class="popup-title">连接失败</text>
        <text class="popup-text">{{ errorMessage }}</text>
        <button class="popup-btn" @click="closeErrorPopup">确定</button>
      </view>
    </uni-popup>
    
    <!-- OKX钱包二维码扫码登录（悬浮窗模式） -->
    <uni-popup ref="qrcodePopup" type="right" mask-click="false">
      <view class="qrcode-popup floating">
        <view class="qrcode-header">
          <text class="popup-title">OKX钱包扫码登录</text>
          <text class="popup-text">请使用OKX钱包APP扫描二维码</text>
          <view class="close-btn" @click="closeQRCodePopup">
            <uni-icons type="close" size="20" color="#666"></uni-icons>
          </view>
        </view>
        
        <view class="qrcode-container">
          <image v-if="qrcodeUrl" class="qrcode-image" :src="qrcodeUrl" mode="aspectFit"></image>
          <view v-else class="qrcode-loading">
            <uni-load-more status="loading" :contentText="{ contentrefresh: '生成二维码中...' }"></uni-load-more>
          </view>
        </view>
        
        <view class="qrcode-footer">
          <button class="popup-btn refresh-btn" @click="refreshQRCode">刷新二维码</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { WALLET_TYPES } from '@/utils/web3'
import uniPopup from '@dcloudio/uni-ui/lib/uni-popup/uni-popup'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons'

export default {
  name: 'wallet-connector',
  components: {
    uniPopup,
    uniIcons
  },
  data() {
    return {
      activeNetwork: 'ethereum', // 默认选择以太坊网络
      errorMessage: '',
      qrcodeUrl: '', // OKX钱包二维码URL
      qrcodePollingTimer: null, // 二维码状态轮询定时器
      
      // 以太坊钱包列表
      ethereumWallets: [
        {
          name: 'MetaMask',
          type: WALLET_TYPES.METAMASK,
          logo: '/static/wallets/metamask.png',
          description: '最流行的以太坊钱包'
        },
        {
          name: 'Coinbase Wallet',
          type: WALLET_TYPES.COINBASE,
          logo: '/static/wallets/coinbase.png',
          description: 'Coinbase官方钱包'
        },
        {
          name: 'OKX Wallet',
          type: WALLET_TYPES.OKX,
          logo: '/static/wallets/okx.svg',
          description: 'OKX交易所官方钱包'
        },
        {
          name: 'Binance Wallet',
          type: WALLET_TYPES.BINANCE,
          logo: '/static/wallets/binance.png',
          description: '币安交易所官方钱包'
        }
      ],
      
      // Solana钱包列表
      solanaWallets: [
        {
          name: 'Phantom',
          type: WALLET_TYPES.PHANTOM,
          logo: '/static/wallets/phantom.png',
          description: '最流行的Solana钱包'
        },
        {
          name: 'Solflare',
          type: WALLET_TYPES.SOLFLARE,
          logo: '/static/wallets/solflare.png',
          description: 'Solana上的全功能钱包'
        }
      ]
    }
  },
  
  computed: {
    ...mapState('wallet', ['connecting', 'error'])
  },
  
  methods: {
    ...mapActions('wallet', ['connectEthWallet', 'connectSolWallet']),
    ...mapActions('user', ['loginWithWallet']),
    
    // 连接钱包
    async connectWallet(walletType) {
      try {
        // 显示连接中状态
        this.$refs.connectingPopup.open()
        
        // 根据不同的网络连接不同的钱包
        let walletInfo
        if (this.activeNetwork === 'ethereum') {
          walletInfo = await this.connectEthWallet(walletType)
          
          // 检查是否需要二维码扫码登录（OKX钱包特殊处理）
          if (walletInfo && walletInfo.needQRCode) {
            // 关闭连接中状态
            this.$refs.connectingPopup.close()
            
            // 生成并显示二维码
            this.generateOKXQRCode()
            return
          }
        } else if (this.activeNetwork === 'solana') {
          walletInfo = await this.connectSolWallet(walletType)
        }
        
        // 连接成功后，使用钱包登录
        await this.loginWithWallet()
        
        // 关闭弹窗
        this.$refs.connectingPopup.close()
        
        // 发出连接成功事件
        this.$emit('connected', walletInfo)
        
        // 显示成功提示
        uni.showToast({
          title: '钱包连接成功',
          icon: 'success'
        })
        
        // 跳转到首页
        setTimeout(() => {
          uni.switchTab({
            url: '/pages/index/index'
          })
        }, 1500)
      } catch (error) {
        console.error('连接钱包失败：', error)
        
        // 关闭连接中状态
        this.$refs.connectingPopup.close()
        
        // 显示错误信息
        this.errorMessage = error.message || '连接钱包失败，请重试'
        this.$refs.errorPopup.open()
        
        // 发出连接失败事件
        this.$emit('error', error)
      }
    },
    
    // 关闭错误弹窗
    closeErrorPopup() {
      this.$refs.errorPopup.close()
    },
    
    // 生成OKX钱包二维码
    async generateOKXQRCode() {
      try {
        // 重置二维码URL
        this.qrcodeUrl = ''
        
        // 显示二维码弹窗
        this.$refs.qrcodePopup.open()
        
        // 调用OKX钱包SDK生成二维码
        // 这里使用模拟数据，实际项目中应该调用OKX钱包SDK的API
        // 参考: https://www.okx.com/web3/build/docs/connect/qrcode
        
        // 模拟API调用延迟
        setTimeout(() => {
          // 生成二维码URL (实际项目中应该从OKX API获取)
          // 这里使用示例二维码，实际使用时需要替换为真实的OKX钱包二维码URL
          this.qrcodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=okx://wallet/connect/'+Math.random()
          
          // 开始轮询检查扫码状态
          this.startQRCodeStatusPolling()
        }, 1000)
      } catch (error) {
        console.error('生成OKX钱包二维码失败：', error)
        this.errorMessage = '生成二维码失败，请重试'
        this.$refs.errorPopup.open()
      }
    },
    
    // 关闭二维码弹窗
    closeQRCodePopup() {
      this.$refs.qrcodePopup.close()
      // 清除轮询定时器
      this.clearQRCodeStatusPolling()
    },
    
    // 刷新二维码
    refreshQRCode() {
      // 清除轮询定时器
      this.clearQRCodeStatusPolling()
      // 重新生成二维码
      this.generateOKXQRCode()
    },
    
    // 开始轮询检查二维码扫描状态
    startQRCodeStatusPolling() {
      // 清除可能存在的定时器
      this.clearQRCodeStatusPolling()
      
      // 设置轮询间隔（每3秒检查一次）
      this.qrcodePollingTimer = setInterval(() => {
        this.checkQRCodeStatus()
      }, 3000)
    },
    
    // 清除二维码状态轮询定时器
    clearQRCodeStatusPolling() {
      if (this.qrcodePollingTimer) {
        clearInterval(this.qrcodePollingTimer)
        this.qrcodePollingTimer = null
      }
    },
    
    // 检查二维码扫描状态
    async checkQRCodeStatus() {
      try {
        // 实际项目中应该调用OKX钱包SDK的API检查扫码状态
        // 这里使用模拟数据进行演示
        
        // 模拟随机扫码成功（实际项目中应该根据API返回结果判断）
        if (Math.random() < 0.1) { // 10%的概率模拟扫码成功
          // 清除轮询定时器
          this.clearQRCodeStatusPolling()
          
          // 关闭二维码弹窗
          this.closeQRCodePopup()
          
          // 模拟钱包信息
          const walletInfo = {
            chainType: 'ethereum',
            walletType: 'OKX',
            address: '0x' + Math.random().toString(16).substr(2, 40),
            balance: '0.0',
            chainId: '1'
          }
          
          // 连接成功后，使用钱包登录
          await this.loginWithWallet()
          
          // 发出连接成功事件
          this.$emit('connected', walletInfo)
          
          // 显示成功提示
          uni.showToast({
            title: '钱包连接成功',
            icon: 'success'
          })
          
          // 跳转到首页
          setTimeout(() => {
            uni.switchTab({
              url: '/pages/index/index'
            })
          }, 1500)
        }
      } catch (error) {
        console.error('检查二维码状态失败：', error)
      }
    }
  }
}
</script>

<style lang="scss">
.wallet-connector {
  padding: 30rpx;
  
  .connector-header {
    margin-bottom: 40rpx;
    text-align: center;
    
    .title {
      font-size: 36rpx;
      font-weight: bold;
      margin-bottom: 10rpx;
      display: block;
    }
    
    .subtitle {
      font-size: 26rpx;
      color: #666;
    }
  }
  
  .network-tabs {
    display: flex;
    margin-bottom: 30rpx;
    border-radius: 10rpx;
    overflow: hidden;
    background-color: #f5f5f5;
    
    .network-tab {
      flex: 1;
      text-align: center;
      padding: 20rpx 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 28rpx;
      
      &.active {
        background-color: #e6f7ff;
        color: #3cc51f;
        font-weight: bold;
      }
      
      .network-icon {
        width: 40rpx;
        height: 40rpx;
        margin-bottom: 10rpx;
      }
    }
  }
  
  .wallet-list {
    margin-bottom: 40rpx;
    
    .wallet-item {
      display: flex;
      align-items: center;
      padding: 30rpx;
      background-color: #fff;
      border-radius: 10rpx;
      margin-bottom: 20rpx;
      box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
      
      &:active {
        background-color: #f9f9f9;
      }
      
      .wallet-logo {
        width: 80rpx;
        height: 80rpx;
        margin-right: 20rpx;
      }
      
      .wallet-info {
        flex: 1;
        
        .wallet-name {
          font-size: 30rpx;
          font-weight: bold;
          margin-bottom: 5rpx;
        }
        
        .wallet-desc {
          font-size: 24rpx;
          color: #999;
        }
      }
    }
  }
  
  .connector-footer {
    text-align: center;
    padding: 20rpx;
    
    .help-text {
      font-size: 24rpx;
      color: #999;
    }
  }
  
  .connecting-popup, .error-popup, .qrcode-popup {
    background-color: #fff;
    border-radius: 10rpx;
    padding: 40rpx;
    width: 500rpx;
    text-align: center;
    
    .popup-title {
      font-size: 32rpx;
      font-weight: bold;
      margin: 20rpx 0;
    }
    
    .popup-text {
      font-size: 28rpx;
      color: #666;
      margin: 20rpx 0;
    }
    
    .popup-btn {
      margin-top: 30rpx;
      background-color: #3cc51f;
      color: #fff;
      border: none;
      font-size: 28rpx;
      padding: 15rpx 40rpx;
    }
  }
  
  .qrcode-popup {
    width: 600rpx;
    
    &.floating {
      width: 450rpx;
      height: 100%;
      border-radius: 0;
      border-top-left-radius: 20rpx;
      border-bottom-left-radius: 20rpx;
      box-shadow: -5rpx 0 15rpx rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      padding: 30rpx;
      box-sizing: border-box;
    }
    
    .qrcode-header {
      margin-bottom: 30rpx;
      position: relative;
      
      .close-btn {
        position: absolute;
        top: 0;
        right: 0;
        width: 60rpx;
        height: 60rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        
        &:active {
          background-color: #f0f0f0;
        }
      }
    }
    
    .qrcode-container {
      width: 320rpx;
      height: 320rpx;
      margin: 0 auto;
      background-color: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8rpx;
      overflow: hidden;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
      
      .qrcode-image {
        width: 100%;
        height: 100%;
      }
      
      .qrcode-loading {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
    
    .qrcode-footer {
      margin-top: 40rpx;
      display: flex;
      justify-content: center;
      
      .popup-btn {
        flex: 1;
        margin: 0 10rpx;
        max-width: 320rpx;
        
        &.cancel-btn {
          background-color: #f5f5f5;
          color: #666;
        }
        
        &.refresh-btn {
          background-color: #3cc51f;
        }
      }
    }
  }
}
</style>