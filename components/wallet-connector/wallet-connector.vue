<template>
  <view class="wallet-connector">
    <view class="connector-header">
      <text class="title">连接钱包</text>
      <text class="subtitle">选择您要连接的钱包类型</text>
    </view>
    
    <!-- 网络选择标签已移除 -->
    
    <view class="wallet-list">
      <!-- 可用钱包列表 -->
      <view>
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
import okxWaaSService from '@/utils/okx-waas'

export default {
  name: 'wallet-connector',
  components: {
    uniPopup,
    uniIcons
  },
  data() {
    return {
      // 已移除网络选择
      errorMessage: '',
      qrcodeUrl: '', // OKX钱包二维码URL
      qrcodePollingTimer: null, // 二维码状态轮询定时器
      
      // 可用钱包列表
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
        }
      ]
    }
  },
  
  computed: {
    ...mapState('wallet', ['connecting', 'error'])
  },
  
  methods: {
    ...mapActions('wallet', ['connectEthWallet', 'fetchOKXAssets']),
    ...mapActions('user', ['loginWithWallet']),
    
    // 连接钱包
    async connectWallet(walletType) {
      try {
        // 显示连接中状态
        this.$refs.connectingPopup.open()
        
        // OKX钱包特殊处理
        if (walletType === WALLET_TYPES.OKX) {
          // 初始化OKX WaaS服务
          await okxWaaSService.initialize()
          
          // 检查是否安装了OKX钱包浏览器插件
          if (okxWaaSService.isOKXWalletInstalled()) {
            // 通过浏览器插件连接
            const walletInfo = await okxWaaSService.connectWithExtension()
            
            // 关闭连接中状态
            this.$refs.connectingPopup.close()
            
            // 连接成功后，使用钱包登录
            await this.loginWithWallet()
            
            // 尝试获取OKX资产信息
            try {
              // 设置API配置（实际应用中应从环境变量或配置文件获取）
              okxWaaSService.setApiConfig({
                apiKey: process.env.VUE_APP_OKX_API_KEY || '',
                secretKey: process.env.VUE_APP_OKX_SECRET_KEY || '',
                passphrase: process.env.VUE_APP_OKX_PASSPHRASE || ''
              })
              
              // 获取资产信息
              await this.fetchOKXAssets()
              
              console.log('OKX资产信息获取成功')
            } catch (assetError) {
              console.warn('获取OKX资产信息失败，但不影响钱包连接:', assetError)
            }
            
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
            
            return
          } else {
            // 如果没有安装OKX钱包浏览器插件，使用二维码扫码登录
            // 关闭连接中状态
            this.$refs.connectingPopup.close()
            
            // 生成并显示二维码
            this.generateOKXQRCode()
            return
          }
        }
        
        // 钱包处理逻辑
        let walletInfo
        walletInfo = await this.connectEthWallet(walletType)
        
        // 检查是否需要二维码扫码登录（兼容旧代码）
        if (walletInfo && walletInfo.needQRCode) {
          // 关闭连接中状态
          this.$refs.connectingPopup.close()
          
          // 生成并显示二维码
          this.generateOKXQRCode()
          return
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
        
        // 初始化OKX WaaS服务
        await okxWaaSService.initialize()
        
        // 生成二维码
        const qrCodeData = await okxWaaSService.generateQRCode()
        
        // 设置二维码URL
        this.qrcodeUrl = qrCodeData.qrCodeUri
        
        // 开始轮询检查扫码状态
        this.startQRCodeStatusPolling()
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
      
      // 使用OKX WaaS服务开始轮询检查二维码状态
      okxWaaSService.startQRCodePolling(async (result) => {
        // 处理不同的状态
        switch (result.status) {
          case 'confirmed':
            // 扫码确认成功
            // 关闭二维码弹窗
            this.closeQRCodePopup()
            
            // 获取钱包信息
            const walletInfo = result.walletInfo
            
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
            break
            
          case 'rejected':
            // 用户拒绝连接
            this.errorMessage = '用户拒绝了连接请求'
            this.$refs.errorPopup.open()
            this.closeQRCodePopup()
            break
            
          case 'expired':
            // 二维码已过期
            this.errorMessage = '二维码已过期，请刷新'
            this.$refs.errorPopup.open()
            break
            
          case 'error':
            // 发生错误
            this.errorMessage = '连接出错，请重试'
            this.$refs.errorPopup.open()
            break
        }
      }, 3000) // 每3秒检查一次
    },
    
    // 清除二维码状态轮询定时器
    clearQRCodeStatusPolling() {
      okxWaaSService.clearQRCodePolling()
    },
    
    // 检查二维码扫描状态 - 手动检查方法
    async checkQRCodeStatus() {
      try {
        const result = await okxWaaSService.checkQRCodeStatus()
        
        // 如果已确认，处理登录流程
        if (result.status === 'confirmed' && result.walletInfo) {
          // 关闭二维码弹窗
          this.closeQRCodePopup()
          
          // 连接成功后，使用钱包登录
          await this.loginWithWallet()
          
          // 发出连接成功事件
          this.$emit('connected', result.walletInfo)
          
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