<template>
  <view class="wallet-connect-page">
    <view class="page-header">
      <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
      <text class="title">欢迎来到Web3社交</text>
      <text class="subtitle">请连接钱包以登录平台</text>
    </view>
    
    <wallet-connector @connected="onWalletConnected" @error="onConnectError"></wallet-connector>
    
    <view class="privacy-terms">
      <text class="privacy-text">连接钱包即表示您同意我们的</text>
      <text class="term-link" @click="goToTerms">使用条款</text>
      <text class="privacy-text">和</text>
      <text class="term-link" @click="goToPrivacy">隐私政策</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {}
  },
  
  onLoad() {
    // 检查是否已登录
    const isLoggedIn = this.$store.state.user.isLoggedIn
    if (isLoggedIn) {
      // 已登录则跳转到首页
      uni.switchTab({
        url: '/pages/index/index'
      })
    }
  },
  
  methods: {
    // 钱包连接成功
    onWalletConnected(walletInfo) {
      console.log('钱包连接成功:', walletInfo)
      
      // 跳转到首页
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/index/index'
        })
      }, 1000)
    },
    
    // 连接错误
    onConnectError(error) {
      console.error('钱包连接失败:', error)
    },
    
    // 查看使用条款
    goToTerms() {
      uni.navigateTo({
        url: '/pages/terms/index'
      })
    },
    
    // 查看隐私政策
    goToPrivacy() {
      uni.navigateTo({
        url: '/pages/privacy/index'
      })
    }
  }
}
</script>

<style lang="scss">
.wallet-connect-page {
  min-height: 100vh;
  padding: 40rpx 30rpx;
  background-color: #fff;
  
  .page-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 60rpx;
    
    .logo {
      width: 180rpx;
      height: 180rpx;
      margin-bottom: 30rpx;
    }
    
    .title {
      font-size: 40rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 20rpx;
    }
    
    .subtitle {
      font-size: 28rpx;
      color: #666;
    }
  }
  
  .privacy-terms {
    text-align: center;
    margin-top: 40rpx;
    padding: 30rpx;
    
    .privacy-text {
      font-size: 24rpx;
      color: #999;
    }
    
    .term-link {
      font-size: 24rpx;
      color: #3cc51f;
      margin: 0 5rpx;
    }
  }
}
</style> 