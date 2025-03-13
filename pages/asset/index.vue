<template>
  <view class="asset-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">资产总览</text>
      <view class="refresh-btn" @click="refreshAssets">
        <uni-icons type="reload" size="20" color="#3cc51f"></uni-icons>
      </view>
    </view>
    
    <!-- 未连接钱包提示 -->
    <view class="connect-wallet-tip" v-if="!isConnected">
      <image class="tip-icon" src="/static/icons/wallet.png" mode="aspectFit"></image>
      <text class="tip-title">请先连接钱包</text>
      <text class="tip-desc">连接钱包后查看您的资产情况</text>
      <button class="connect-btn" @click="goToConnectWallet">连接钱包</button>
    </view>
    
    <!-- 资产内容 -->
    <block v-else>
      <!-- 总资产概览 -->
      <view class="asset-overview">
        <view class="asset-card">
          <view class="total-value">
            <text class="value-label">总资产价值</text>
            <text class="value-text">{{ formattedTotalValue }}</text>
            <text class="wallet-address">{{ formatAddress(address) }}</text>
          </view>
          
          <view class="update-time" v-if="lastUpdated">
            <text>更新于: {{ formatTime(lastUpdated) }}</text>
          </view>
        </view>
      </view>
      
      <!-- 正在加载 -->
      <view class="loading-container" v-if="loading">
        <uni-load-more status="loading" :contentText="{ contentrefresh: '加载资产数据...' }"></uni-load-more>
      </view>
      
      <!-- 资产分布图表 -->
      <view class="asset-chart" v-if="!loading && distribution.length > 0">
        <asset-chart 
          :chartData="distribution" 
          type="ring" 
          :height="300" 
          title="资产分布"
        ></asset-chart>
      </view>
      
      <!-- 代币列表 -->
      <view class="asset-list" v-if="!loading && assets.length > 0">
        <view class="section-header">
          <text class="section-title">代币资产</text>
          <text class="asset-count">{{ assetCount }} 个代币</text>
        </view>
        
        <view class="token-list">
          <view 
            class="token-item" 
            v-for="(token, index) in sortedAssetsByValue" 
            :key="token.id || index"
          >
            <image 
              class="token-icon" 
              :src="token.logo || '/static/icons/token-default.png'" 
              mode="aspectFit"
            ></image>
            
            <view class="token-info">
              <text class="token-name">{{ token.name }}</text>
              <text class="token-symbol">{{ token.symbol }}</text>
            </view>
            
            <view class="token-balance">
              <text class="balance-value">{{ formatAmount(token.balance, 4, '') }}</text>
              <text class="balance-value-usd">{{ formatAmount(token.valueUsd, 2, '$') }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- NFT列表 -->
      <view class="nft-list" v-if="!loading && nfts.length > 0">
        <view class="section-header">
          <text class="section-title">NFT资产</text>
          <text class="asset-count">{{ nftCount }} 个NFT</text>
        </view>
        
        <scroll-view scroll-x class="nft-scroll">
          <view class="nft-scroll-content">
            <view 
              class="nft-item" 
              v-for="(nft, index) in nfts" 
              :key="nft.id || index"
              @click="previewNft(nft)"
            >
              <image 
                class="nft-image" 
                :src="nft.image || '/static/icons/nft-default.png'" 
                mode="aspectFill"
              ></image>
              <view class="nft-info">
                <text class="nft-name">{{ nft.name }}</text>
                <text class="nft-collection">{{ nft.collection }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
      
      <!-- 最近交易 -->
      <view class="recent-transactions" v-if="!loading && recentTransactions.length > 0">
        <view class="section-header">
          <text class="section-title">最近交易</text>
        </view>
        
        <view class="transaction-list">
          <view 
            class="transaction-item" 
            v-for="(tx, index) in recentTransactions" 
            :key="tx.hash || index"
            @click="openTransaction(tx)"
          >
            <view class="tx-icon" :class="{ 'tx-out': tx.type === 'out', 'tx-in': tx.type === 'in' }">
              <uni-icons :type="tx.type === 'out' ? 'arrow-up' : 'arrow-down'" size="16" color="#fff"></uni-icons>
            </view>
            
            <view class="tx-info">
              <text class="tx-type">{{ getTxTypeText(tx.type) }}</text>
              <text class="tx-hash">{{ formatTxHash(tx.hash) }}</text>
              <text class="tx-time">{{ formatRelativeTime(tx.timestamp) }}</text>
            </view>
            
            <view class="tx-value">
              <text class="tx-amount" :class="{ 'amount-out': tx.type === 'out', 'amount-in': tx.type === 'in' }">
                {{ tx.type === 'out' ? '-' : '+' }}{{ formatAmount(tx.value, 4, '') }} {{ tx.symbol }}
              </text>
              <text class="tx-amount-usd">{{ formatAmount(tx.valueUsd, 2, '$') }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 资产为空的提示 -->
      <view class="empty-assets" v-if="!loading && assets.length === 0 && nfts.length === 0">
        <uni-icons type="wallet" size="50" color="#ddd"></uni-icons>
        <text class="empty-text">暂无资产数据</text>
        <text class="empty-tips">请确保您的钱包中有资产或尝试连接其他钱包</text>
      </view>
    </block>
  </view>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { formatAddress, formatAmount, formatTime, formatRelativeTime, formatTxHash } from '@/utils/format'

export default {
  data() {
    return {}
  },
  
  computed: {
    ...mapState('wallet', ['isConnected', 'address']),
    ...mapState('asset', [
      'assets', 
      'nfts', 
      'distribution', 
      'recentTransactions', 
      'loading', 
      'lastUpdated'
    ]),
    ...mapGetters('asset', [
      'formattedTotalValue', 
      'assetCount', 
      'nftCount', 
      'sortedAssetsByValue'
    ])
  },
  
  onLoad() {
    this.initialize()
  },
  
  onShow() {
    this.refreshIfNeeded()
  },
  
  onPullDownRefresh() {
    this.refreshAssets().then(() => {
      uni.stopPullDownRefresh()
    })
  },
  
  methods: {
    ...mapActions('asset', ['fetchUserAssets', 'refreshAssets']),
    
    // 初始化页面
    initialize() {
      // 如果已连接钱包，加载资产数据
      if (this.isConnected) {
        this.fetchUserAssets()
      }
    },
    
    // 如果需要，刷新数据
    refreshIfNeeded() {
      // 已连接钱包但没有资产数据，或者超过10分钟未更新，则刷新
      if (this.isConnected) {
        const needRefresh = 
          this.assets.length === 0 || 
          !this.lastUpdated || 
          (Date.now() - this.lastUpdated > 10 * 60 * 1000)
          
        if (needRefresh) {
          this.refreshAssets()
        }
      }
    },
    
    // 刷新资产数据
    handleRefresh() {
      if (this.isConnected) {
        this.refreshAssets()
      }
    },
    
    // 跳转到连接钱包页面
    goToConnectWallet() {
      uni.navigateTo({
        url: '/pages/wallet/connect'
      })
    },
    
    // 预览NFT
    previewNft(nft) {
      if (nft.image) {
        uni.previewImage({
          urls: [nft.image],
          current: 0
        })
      }
    },
    
    // 打开交易详情
    openTransaction(tx) {
      // 构建区块浏览器URL
      let url = ''
      if (tx.chain === 'ethereum') {
        url = `https://etherscan.io/tx/${tx.hash}`
      } else if (tx.chain === 'solana') {
        url = `https://explorer.solana.com/tx/${tx.hash}`
      }
      
      if (url) {
        // #ifdef H5
        window.open(url)
        // #endif
        
        // #ifdef APP-PLUS
        plus.runtime.openURL(url)
        // #endif
      }
    },
    
    // 获取交易类型文本
    getTxTypeText(type) {
      const typeMap = {
        'in': '转入',
        'out': '转出',
        'swap': '兑换',
        'approve': '授权',
        'mint': '铸造',
        'burn': '销毁'
      }
      
      return typeMap[type] || type
    },
    
    // 格式化相关工具函数
    formatAddress,
    formatAmount,
    formatTime,
    formatRelativeTime,
    formatTxHash
  }
}
</script>

<style lang="scss">
.asset-page {
  padding-bottom: 30rpx;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20rpx 30rpx;
    
    .page-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
    }
    
    .refresh-btn {
      padding: 10rpx;
      border-radius: 50%;
      background-color: #f5f5f5;
    }
  }
  
  .connect-wallet-tip {
    margin: 40rpx 30rpx;
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
  
  .asset-overview {
    padding: 0 30rpx;
    margin-bottom: 30rpx;
    
    .asset-card {
      background-color: #3cc51f;
      border-radius: 16rpx;
      padding: 30rpx;
      color: #fff;
      
      .total-value {
        margin-bottom: 20rpx;
        
        .value-label {
          font-size: 28rpx;
          opacity: 0.8;
          display: block;
          margin-bottom: 10rpx;
        }
        
        .value-text {
          font-size: 48rpx;
          font-weight: bold;
          display: block;
          margin-bottom: 20rpx;
        }
        
        .wallet-address {
          font-size: 24rpx;
          background-color: rgba(255, 255, 255, 0.2);
          padding: 6rpx 16rpx;
          border-radius: 30rpx;
        }
      }
      
      .update-time {
        font-size: 22rpx;
        opacity: 0.7;
        text-align: right;
      }
    }
  }
  
  .loading-container {
    margin: 80rpx 0;
  }
  
  .asset-chart {
    margin: 0 30rpx;
    margin-bottom: 30rpx;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 30rpx;
    margin-bottom: 20rpx;
    
    .section-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
    
    .asset-count {
      font-size: 24rpx;
      color: #999;
    }
  }
  
  .token-list {
    padding: 0 30rpx;
    
    .token-item {
      display: flex;
      align-items: center;
      background-color: #fff;
      border-radius: 10rpx;
      padding: 20rpx;
      margin-bottom: 20rpx;
      box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
      
      .token-icon {
        width: 80rpx;
        height: 80rpx;
        border-radius: 40rpx;
        margin-right: 20rpx;
      }
      
      .token-info {
        flex: 1;
        
        .token-name {
          font-size: 28rpx;
          font-weight: 500;
          color: #333;
          margin-bottom: 5rpx;
          display: block;
        }
        
        .token-symbol {
          font-size: 24rpx;
          color: #999;
        }
      }
      
      .token-balance {
        text-align: right;
        
        .balance-value {
          font-size: 28rpx;
          font-weight: 500;
          color: #333;
          display: block;
          margin-bottom: 5rpx;
        }
        
        .balance-value-usd {
          font-size: 24rpx;
          color: #999;
        }
      }
    }
  }
  
  .nft-list {
    margin-top: 40rpx;
    margin-bottom: 30rpx;
    
    .nft-scroll {
      padding: 0 30rpx;
      
      .nft-scroll-content {
        display: flex;
        padding: 10rpx 0;
      }
      
      .nft-item {
        width: 280rpx;
        margin-right: 20rpx;
        background-color: #fff;
        border-radius: 10rpx;
        overflow: hidden;
        box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
        
        .nft-image {
          width: 280rpx;
          height: 280rpx;
          background-color: #f5f5f5;
        }
        
        .nft-info {
          padding: 20rpx;
          
          .nft-name {
            font-size: 28rpx;
            font-weight: 500;
            color: #333;
            margin-bottom: 5rpx;
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .nft-collection {
            font-size: 24rpx;
            color: #999;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
    }
  }
  
  .recent-transactions {
    margin-top: 40rpx;
    
    .transaction-list {
      padding: 0 30rpx;
      
      .transaction-item {
        display: flex;
        align-items: center;
        background-color: #fff;
        border-radius: 10rpx;
        padding: 20rpx;
        margin-bottom: 20rpx;
        box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
        
        .tx-icon {
          width: 60rpx;
          height: 60rpx;
          border-radius: 30rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 20rpx;
          
          &.tx-out {
            background-color: #ff4d4f;
          }
          
          &.tx-in {
            background-color: #52c41a;
          }
        }
        
        .tx-info {
          flex: 1;
          
          .tx-type {
            font-size: 28rpx;
            font-weight: 500;
            color: #333;
            margin-bottom: 5rpx;
            display: block;
          }
          
          .tx-hash {
            font-size: 24rpx;
            color: #666;
            margin-bottom: 5rpx;
            display: block;
          }
          
          .tx-time {
            font-size: 22rpx;
            color: #999;
          }
        }
        
        .tx-value {
          text-align: right;
          
          .tx-amount {
            font-size: 28rpx;
            font-weight: 500;
            margin-bottom: 5rpx;
            display: block;
            
            &.amount-out {
              color: #ff4d4f;
            }
            
            &.amount-in {
              color: #52c41a;
            }
          }
          
          .tx-amount-usd {
            font-size: 24rpx;
            color: #999;
          }
        }
      }
    }
  }
  
  .empty-assets {
    margin-top: 100rpx;
    text-align: center;
    
    .empty-text {
      font-size: 32rpx;
      color: #999;
      margin: 30rpx 0 15rpx;
      display: block;
    }
    
    .empty-tips {
      font-size: 26rpx;
      color: #bbb;
      padding: 0 100rpx;
    }
  }
}
</style> 