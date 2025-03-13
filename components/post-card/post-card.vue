<template>
  <view class="post-card" @click="goToDetail">
    <!-- 帖子作者信息 -->
    <view class="post-header">
      <image class="avatar" :src="post.author.avatar || defaultAvatar" @click.stop="goToUserProfile"></image>
      <view class="author-info" @click.stop="goToUserProfile">
        <text class="nickname">{{ post.author.nickname }}</text>
        <view class="sub-info">
          <text class="address">{{ formatAddress(post.author.address) }}</text>
          <text class="time">{{ formatRelativeTime(post.createdAt) }}</text>
        </view>
      </view>
    </view>
    
    <!-- 帖子内容 -->
    <view class="post-content">
      <text class="post-title" v-if="post.title">{{ post.title }}</text>
      <text class="post-text">{{ post.content }}</text>
      
      <!-- 图片展示 -->
      <view class="post-images" v-if="post.images && post.images.length > 0">
        <view class="image-grid" :class="getImageGridClass(post.images.length)">
          <image 
            v-for="(image, index) in post.images" 
            :key="index" 
            :src="image"
            mode="aspectFill"
            class="post-image"
            @click.stop="previewImage(index)"
          ></image>
        </view>
      </view>
      
      <!-- 交易信息展示 -->
      <view class="transaction-info" v-if="post.transactionInfo">
        <uni-icons type="paperplane" size="16" color="#3cc51f"></uni-icons>
        <text class="tx-text">
          交易哈希: {{ formatTxHash(post.transactionInfo.hash) }}
        </text>
        <text class="tx-link" @click.stop="openTransaction">查看</text>
      </view>
      
      <!-- 标签展示 -->
      <view class="post-tags" v-if="post.tags && post.tags.length > 0">
        <text 
          v-for="(tag, index) in post.tags" 
          :key="index"
          class="tag"
          @click.stop="goToTag(tag)"
        >
          #{{ tag }}
        </text>
      </view>
    </view>
    
    <!-- 帖子操作栏 -->
    <view class="post-actions">
      <view class="action-item" @click.stop="handleLike">
        <uni-icons 
          :type="post.isLiked ? 'heart-filled' : 'heart'" 
          size="20" 
          :color="post.isLiked ? '#ff4d4f' : '#999'"
        ></uni-icons>
        <text class="action-text" :class="{'liked': post.isLiked}">
          {{ post.likeCount || 0 }}
        </text>
      </view>
      
      <view class="action-item" @click.stop="handleComment">
        <uni-icons type="chat" size="20" color="#999"></uni-icons>
        <text class="action-text">{{ post.commentCount || 0 }}</text>
      </view>
      
      <view class="action-item" @click.stop="handleShare">
        <uni-icons type="redo" size="20" color="#999"></uni-icons>
        <text class="action-text">分享</text>
      </view>
    </view>
  </view>
</template>

<script>
import { mapActions } from 'vuex'
import { formatAddress, formatRelativeTime, formatTxHash } from '@/utils/format'
import { getIpfsUrl } from '@/utils/ipfs'

export default {
  name: 'post-card',
  
  props: {
    // 帖子数据
    post: {
      type: Object,
      required: true
    }
  },
  
  data() {
    return {
      defaultAvatar: '/static/images/default-avatar.png'
    }
  },
  
  methods: {
    ...mapActions('post', ['toggleLike']),
    
    // 格式化相对时间
    formatRelativeTime(time) {
      return formatRelativeTime(time)
    },
    
    // 格式化钱包地址
    formatAddress(address) {
      return formatAddress(address)
    },
    
    // 格式化交易哈希
    formatTxHash(hash) {
      return formatTxHash(hash)
    },
    
    // 处理点赞事件
    async handleLike() {
      try {
        await this.toggleLike(this.post.id)
      } catch (error) {
        // 处理未登录的情况
        if (error.message.includes('请先连接钱包')) {
          uni.navigateTo({
            url: '/pages/wallet/connect'
          })
        } else {
          uni.showToast({
            title: error.message,
            icon: 'none'
          })
        }
      }
    },
    
    // 处理评论事件
    handleComment() {
      this.goToDetail()
    },
    
    // 处理分享事件
    handleShare() {
      uni.showActionSheet({
        itemList: ['分享到微信', '复制链接'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 分享到微信
            // #ifdef H5
            uni.showToast({
              title: 'H5环境不支持微信分享，请复制链接分享',
              icon: 'none'
            })
            // #endif
            
            // #ifdef APP-PLUS
            uni.share({
              provider: 'weixin',
              scene: 'WXSceneSession',
              type: 0,
              title: this.post.title || '来自Web3Social的帖子',
              summary: this.post.content.slice(0, 100),
              imageUrl: this.post.images && this.post.images.length > 0 ? this.post.images[0] : '',
              href: `https://web3social.example.com/post/${this.post.id}`
            })
            // #endif
          } else if (res.tapIndex === 1) {
            // 复制链接
            uni.setClipboardData({
              data: `https://web3social.example.com/post/${this.post.id}`,
              success: () => {
                uni.showToast({
                  title: '链接已复制',
                  icon: 'success'
                })
              }
            })
          }
        }
      })
    },
    
    // 获取图片布局类
    getImageGridClass(count) {
      if (count === 1) return 'grid-1'
      if (count === 2) return 'grid-2'
      if (count === 3) return 'grid-3'
      if (count === 4) return 'grid-4'
      return 'grid-more'
    },
    
    // 预览图片
    previewImage(index) {
      uni.previewImage({
        urls: this.post.images,
        current: index
      })
    },
    
    // 打开交易详情
    openTransaction() {
      if (!this.post.transactionInfo) return
      
      const { hash, chainType } = this.post.transactionInfo
      
      // 构建区块浏览器URL
      let url = ''
      if (chainType === 'ethereum') {
        url = `https://etherscan.io/tx/${hash}`
      } else if (chainType === 'solana') {
        url = `https://explorer.solana.com/tx/${hash}`
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
    
    // 跳转到标签页
    goToTag(tag) {
      uni.navigateTo({
        url: `/pages/post/index?tag=${tag}`
      })
    },
    
    // 跳转到用户资料页
    goToUserProfile() {
      uni.navigateTo({
        url: `/pages/user/index?id=${this.post.author.userId}`
      })
    },
    
    // 跳转到帖子详情页
    goToDetail() {
      uni.navigateTo({
        url: `/pages/post/detail?id=${this.post.id}`
      })
    }
  }
}
</script>

<style lang="scss">
.post-card {
  background-color: #fff;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  
  .post-header {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    
    .avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 40rpx;
      margin-right: 20rpx;
    }
    
    .author-info {
      flex: 1;
      
      .nickname {
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 5rpx;
      }
      
      .sub-info {
        display: flex;
        align-items: center;
        
        .address {
          font-size: 24rpx;
          color: #999;
          margin-right: 10rpx;
          background-color: #f5f5f5;
          padding: 2rpx 8rpx;
          border-radius: 6rpx;
        }
        
        .time {
          font-size: 24rpx;
          color: #999;
        }
      }
    }
  }
  
  .post-content {
    margin-bottom: 20rpx;
    
    .post-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 10rpx;
      display: block;
    }
    
    .post-text {
      font-size: 28rpx;
      color: #333;
      line-height: 1.5;
      margin-bottom: 15rpx;
    }
    
    .post-images {
      margin: 20rpx 0;
      
      .image-grid {
        display: flex;
        flex-wrap: wrap;
        
        &.grid-1 {
          .post-image {
            width: 100%;
            height: 400rpx;
          }
        }
        
        &.grid-2 {
          .post-image {
            width: 48%;
            height: 300rpx;
            margin-right: 4%;
            
            &:nth-child(2n) {
              margin-right: 0;
            }
          }
        }
        
        &.grid-3 {
          .post-image {
            width: 31%;
            height: 200rpx;
            margin-right: 3.5%;
            
            &:nth-child(3n) {
              margin-right: 0;
            }
          }
        }
        
        &.grid-4, &.grid-more {
          .post-image {
            width: 24%;
            height: 180rpx;
            margin-right: 1.33%;
            margin-bottom: 10rpx;
            
            &:nth-child(4n) {
              margin-right: 0;
            }
          }
        }
        
        .post-image {
          border-radius: 6rpx;
        }
      }
    }
    
    .transaction-info {
      display: flex;
      align-items: center;
      background-color: #f9f9f9;
      padding: 15rpx;
      border-radius: 6rpx;
      margin-top: 20rpx;
      
      .tx-text {
        flex: 1;
        font-size: 24rpx;
        color: #666;
        margin-left: 10rpx;
      }
      
      .tx-link {
        font-size: 24rpx;
        color: #3cc51f;
      }
    }
    
    .post-tags {
      margin-top: 15rpx;
      display: flex;
      flex-wrap: wrap;
      
      .tag {
        font-size: 24rpx;
        color: #3cc51f;
        margin-right: 15rpx;
        margin-bottom: 10rpx;
      }
    }
  }
  
  .post-actions {
    display: flex;
    border-top: 1rpx solid #eee;
    padding-top: 20rpx;
    
    .action-item {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .action-text {
        font-size: 26rpx;
        color: #999;
        margin-left: 10rpx;
        
        &.liked {
          color: #ff4d4f;
        }
      }
    }
  }
}
</style> 