<template>
  <view class="index-page">
    <!-- 顶部导航栏 -->
    <view class="top-nav">
      <view class="logo-area">
        <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
        <text class="app-name">Web3社交</text>
      </view>
      
      <view class="wallet-status" @click="handleWalletClick">
        <view v-if="isConnected" class="connected">
          <view class="status-dot"></view>
          <text class="wallet-text">{{ shortAddress }}</text>
        </view>
        <view v-else class="not-connected">
          <text class="wallet-text">连接钱包</text>
        </view>
      </view>
    </view>
    
    <!-- 资产概览 -->
    <view class="asset-overview" v-if="isConnected">
      <view class="asset-card">
        <view class="card-header">
          <text class="card-title">资产总览</text>
          <text class="view-more" @click="goToAssetPage">查看详情</text>
        </view>
        
        <view class="asset-info">
          <view class="total-value">
            <text class="value-text">{{ formattedTotalValue }}</text>
            <text class="value-label">总资产价值</text>
          </view>
          
          <view class="asset-stats">
            <view class="stat-item">
              <text class="stat-value">{{ assetCount }}</text>
              <text class="stat-label">代币数量</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ nftCount }}</text>
              <text class="stat-label">NFT数量</text>
            </view>
          </view>
        </view>
        
        <!-- 资产分布图表 -->
        <view class="asset-chart-container" v-if="distribution.length > 0">
          <asset-chart 
            :chartData="distribution" 
            type="ring" 
            :height="220" 
            title="资产分布"
          ></asset-chart>
        </view>
      </view>
    </view>
    
    <!-- 未连接钱包提示 -->
    <view class="connect-wallet-tip" v-if="!isConnected">
      <image class="tip-icon" src="/static/icons/wallet.png" mode="aspectFit"></image>
      <text class="tip-title">连接钱包，开启Web3之旅</text>
      <text class="tip-desc">连接您的钱包，展示您的资产，与社区互动</text>
      <button class="connect-btn" @click="goToConnectWallet">连接钱包</button>
    </view>
    
    <!-- 热门内容 -->
    <view class="hot-content">
      <view class="section-header">
        <text class="section-title">热门内容</text>
        <text class="view-more" @click="goToCommunity">查看更多</text>
      </view>
      
      <view class="post-list">
        <view v-if="loading" class="loading-container">
          <uni-load-more status="loading" :contentText="{ contentrefresh: '加载中...' }"></uni-load-more>
        </view>
        
        <view v-else-if="hotPosts.length === 0" class="empty-container">
          <uni-icons type="folder-open" size="40" color="#ddd"></uni-icons>
          <text class="empty-text">暂无热门内容</text>
        </view>
        
        <block v-else>
          <post-card 
            v-for="post in hotPosts" 
            :key="post.id" 
            :post="post"
          ></post-card>
        </block>
      </view>
    </view>
    
    <!-- 功能入口 -->
    <view class="feature-entries">
      <view class="section-header">
        <text class="section-title">探索功能</text>
      </view>
      
      <view class="entries-grid">
        <view class="entry-item" @click="goToAssetPage">
          <image class="entry-icon" src="/static/icons/asset.png" mode="aspectFit"></image>
          <text class="entry-text">资产展示</text>
        </view>
        
        <view class="entry-item" @click="goToCommunity">
          <image class="entry-icon" src="/static/icons/community.png" mode="aspectFit"></image>
          <text class="entry-text">社区广场</text>
        </view>
        
        <view class="entry-item" @click="goToCreatePost">
          <image class="entry-icon" src="/static/icons/post.png" mode="aspectFit"></image>
          <text class="entry-text">发表帖子</text>
        </view>
        
        <view class="entry-item" @click="goToProfile">
          <image class="entry-icon" src="/static/icons/user.png" mode="aspectFit"></image>
          <text class="entry-text">个人主页</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  data() {
    return {
      // 本页面显示的热门帖子数量
      hotPostsLimit: 3
    }
  },
  
  computed: {
    ...mapState('wallet', ['isConnected']),
    ...mapGetters('wallet', ['shortAddress']),
    ...mapState('asset', ['loading', 'distribution']),
    ...mapGetters('asset', ['formattedTotalValue', 'assetCount', 'nftCount']),
    ...mapGetters('post', ['hotPosts']),
    
    // 首页展示的热门帖子（限制数量）
    limitedHotPosts() {
      return this.hotPosts.slice(0, this.hotPostsLimit)
    }
  },
  
  onLoad() {
    // 初始化数据
    this.initialize()
  },
  
  onShow() {
    // 每次页面显示时刷新数据
    this.refreshData()
  },
  
  onPullDownRefresh() {
    // 下拉刷新
    this.refreshData().then(() => {
      uni.stopPullDownRefresh()
    })
  },
  
  methods: {
    ...mapActions('post', ['fetchPosts']),
    ...mapActions('asset', ['fetchUserAssets']),
    
    // 初始化数据
    async initialize() {
      try {
        // 获取帖子数据
        await this.fetchPosts({
          reset: true,
          sortBy: 'hot',
          pageSize: 10
        })
        
        // 如果已连接钱包，获取资产数据
        if (this.isConnected) {
          await this.fetchUserAssets()
        }
      } catch (error) {
        console.error('初始化数据失败:', error)
      }
    },
    
    // 刷新数据
    async refreshData() {
      try {
        const promises = [
          this.fetchPosts({
            reset: true,
            sortBy: 'hot',
            pageSize: 10
          })
        ]
        
        // 如果已连接钱包，刷新资产数据
        if (this.isConnected) {
          promises.push(this.fetchUserAssets())
        }
        
        await Promise.all(promises)
      } catch (error) {
        console.error('刷新数据失败:', error)
      }
    },
    
    // 点击钱包状态
    handleWalletClick() {
      if (this.isConnected) {
        // 已连接则跳转到资产页面
        this.goToAssetPage()
      } else {
        // 未连接则跳转到连接钱包页面
        this.goToConnectWallet()
      }
    },
    
    // 跳转到连接钱包页面
    goToConnectWallet() {
      uni.navigateTo({
        url: '/pages/wallet/connect'
      })
    },
    
    // 跳转到资产页面
    goToAssetPage() {
      uni.switchTab({
        url: '/pages/asset/index'
      })
    },
    
    // 跳转到社区页面
    goToCommunity() {
      uni.switchTab({
        url: '/pages/post/index'
      })
    },
    
    // 跳转到发布帖子页面
    goToCreatePost() {
      uni.navigateTo({
        url: '/pages/post/create'
      })
    },
    
    // 跳转到个人资料页面
    goToProfile() {
      uni.switchTab({
        url: '/pages/user/index'
      })
    }
  }
}
</script>

<style lang="scss">
.index-page {
  padding-bottom: 30rpx;
  
  .top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20rpx 30rpx;
    background-color: #fff;
    
    .logo-area {
      display: flex;
      align-items: center;
      
      .logo {
        width: 60rpx;
        height: 60rpx;
        margin-right: 10rpx;
      }
      
      .app-name {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }
    }
    
    .wallet-status {
      padding: 8rpx 16rpx;
      border-radius: 30rpx;
      font-size: 24rpx;
      
      .connected {
        display: flex;
        align-items: center;
        background-color: #f0f8eb;
        padding: 8rpx 16rpx;
        border-radius: 30rpx;
        
        .status-dot {
          width: 16rpx;
          height: 16rpx;
          border-radius: 8rpx;
          background-color: #3cc51f;
          margin-right: 10rpx;
        }
        
        .wallet-text {
          color: #3cc51f;
        }
      }
      
      .not-connected {
        background-color: #f5f5f5;
        padding: 8rpx 16rpx;
        border-radius: 30rpx;
        
        .wallet-text {
          color: #666;
        }
      }
    }
  }
  
  .asset-overview {
    padding: 20rpx 30rpx;
    
    .asset-card {
      background-color: #fff;
      border-radius: 10rpx;
      padding: 30rpx;
      box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;
        
        .card-title {
          font-size: 32rpx;
          font-weight: bold;
          color: #333;
        }
        
        .view-more {
          font-size: 24rpx;
          color: #3cc51f;
        }
      }
      
      .asset-info {
        display: flex;
        margin-bottom: 30rpx;
        
        .total-value {
          flex: 1;
          
          .value-text {
            font-size: 40rpx;
            font-weight: bold;
            color: #333;
            display: block;
            margin-bottom: 10rpx;
          }
          
          .value-label {
            font-size: 24rpx;
            color: #999;
          }
        }
        
        .asset-stats {
          display: flex;
          
          .stat-item {
            margin-left: 30rpx;
            text-align: right;
            
            .stat-value {
              font-size: 32rpx;
              font-weight: bold;
              color: #333;
              display: block;
              margin-bottom: 10rpx;
            }
            
            .stat-label {
              font-size: 24rpx;
              color: #999;
            }
          }
        }
      }
    }
  }
  
  .connect-wallet-tip {
    margin: 20rpx 30rpx;
    background-color: #fff;
    border-radius: 10rpx;
    padding: 40rpx 30rpx;
    text-align: center;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
    
    .tip-icon {
      width: 100rpx;
      height: 100rpx;
      margin-bottom: 20rpx;
    }
    
    .tip-title {
      font-size: 34rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 15rpx;
      display: block;
    }
    
    .tip-desc {
      font-size: 26rpx;
      color: #666;
      margin-bottom: 30rpx;
      display: block;
    }
    
    .connect-btn {
      width: 400rpx;
      height: 80rpx;
      line-height: 80rpx;
      background-color: #3cc51f;
      color: #fff;
      font-size: 30rpx;
      border-radius: 40rpx;
    }
  }
  
  .hot-content {
    margin: 20rpx 0;
    padding: 0 30rpx;
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;
      
      .section-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }
      
      .view-more {
        font-size: 24rpx;
        color: #3cc51f;
      }
    }
    
    .post-list {
      .loading-container,
      .empty-container {
        padding: 60rpx 0;
        text-align: center;
        
        .empty-text {
          font-size: 28rpx;
          color: #999;
          margin-top: 20rpx;
        }
      }
    }
  }
  
  .feature-entries {
    padding: 0 30rpx;
    margin-top: 30rpx;
    
    .section-header {
      margin-bottom: 20rpx;
      
      .section-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }
    }
    
    .entries-grid {
      display: flex;
      flex-wrap: wrap;
      
      .entry-item {
        width: 25%;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20rpx 0;
        
        .entry-icon {
          width: 80rpx;
          height: 80rpx;
          margin-bottom: 10rpx;
        }
        
        .entry-text {
          font-size: 24rpx;
          color: #666;
        }
      }
    }
  }
}
</style> 