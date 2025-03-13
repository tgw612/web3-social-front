<template>
  <view class="user-info">
    <!-- 头像和基本信息 -->
    <view class="user-header">
      <image class="user-avatar" :src="userInfo.avatar || defaultAvatar" mode="aspectFill"></image>
      <view class="user-basic">
        <text class="user-nickname">{{ userInfo.nickname }}</text>
        <text class="user-username">@{{ userInfo.username }}</text>
        <view class="wallet-info">
          <view class="wallet-address" @click="copyAddress">
            <text>{{ formatAddress(userInfo.address) }}</text>
            <uni-icons type="copy" size="14" color="#999"></uni-icons>
          </view>
          <view class="chain-badge" :class="chainClass">{{ chainType }}</view>
        </view>
      </view>
    </view>
    
    <!-- 个人简介 -->
    <view class="user-bio" v-if="userInfo.bio">
      <text>{{ userInfo.bio }}</text>
    </view>
    
    <!-- 资产和社区数据 -->
    <view class="user-stats">
      <view class="stat-item">
        <text class="stat-value">{{ formatAmount(userInfo.totalAssets) }}</text>
        <text class="stat-label">总资产</text>
      </view>
      <view class="divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ userInfo.followerCount || 0 }}</text>
        <text class="stat-label">粉丝</text>
      </view>
      <view class="divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ userInfo.followingCount || 0 }}</text>
        <text class="stat-label">关注</text>
      </view>
      <view class="divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ userInfo.postCount || 0 }}</text>
        <text class="stat-label">帖子</text>
      </view>
    </view>
    
    <!-- 操作按钮 -->
    <view class="user-actions" v-if="showActions">
      <button 
        class="action-btn follow-btn" 
        :class="{'followed': isFollowed}"
        @click="handleFollow"
      >
        {{ isFollowed ? '已关注' : '关注' }}
      </button>
      
      <button 
        class="action-btn message-btn"
        @click="handleMessage"
      >
        发消息
      </button>
      
      <button 
        class="action-btn more-btn"
        @click="handleMore"
      >
        <uni-icons type="more-filled" size="18" color="#999"></uni-icons>
      </button>
    </view>
    
    <!-- 编辑按钮 -->
    <view class="edit-action" v-if="isCurrentUser">
      <button class="edit-btn" @click="handleEdit">编辑资料</button>
    </view>
  </view>
</template>

<script>
import { formatAddress, formatAmount } from '@/utils/format'
import { mapGetters } from 'vuex'

export default {
  name: 'user-info',
  
  props: {
    // 用户信息
    userInfo: {
      type: Object,
      required: true
    },
    
    // 是否显示操作按钮
    showActions: {
      type: Boolean,
      default: true
    },
    
    // 是否已关注
    isFollowed: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      defaultAvatar: '/static/images/default-avatar.png'
    }
  },
  
  computed: {
    ...mapGetters('user', ['hasUserInfo']),
    ...mapGetters('wallet', ['isETH', 'isSOL']),
    
    // 是否是当前登录用户
    isCurrentUser() {
      return this.hasUserInfo && this.$store.state.user.userInfo.userId === this.userInfo.userId
    },
    
    // 链类型
    chainType() {
      if (!this.userInfo.address) return ''
      
      const chainType = this.userInfo.chainType
      if (chainType === 'ethereum') return 'ETH'
      if (chainType === 'solana') return 'SOL'
      return ''
    },
    
    // 链类型样式
    chainClass() {
      const chainType = this.userInfo.chainType
      if (chainType === 'ethereum') return 'eth'
      if (chainType === 'solana') return 'sol'
      return ''
    }
  },
  
  methods: {
    // 格式化地址
    formatAddress(address) {
      return formatAddress(address)
    },
    
    // 格式化资产金额
    formatAmount(amount) {
      return formatAmount(amount, 2, '$')
    },
    
    // 复制地址
    copyAddress() {
      if (!this.userInfo.address) return
      
      uni.setClipboardData({
        data: this.userInfo.address,
        success: () => {
          uni.showToast({
            title: '地址已复制',
            icon: 'success'
          })
        }
      })
    },
    
    // 关注/取消关注
    handleFollow() {
      // 未登录情况处理
      if (!this.hasUserInfo) {
        uni.navigateTo({
          url: '/pages/wallet/connect'
        })
        return
      }
      
      this.$emit('follow', {
        userId: this.userInfo.userId,
        isFollowed: !this.isFollowed
      })
    },
    
    // 发送消息
    handleMessage() {
      // 未登录情况处理
      if (!this.hasUserInfo) {
        uni.navigateTo({
          url: '/pages/wallet/connect'
        })
        return
      }
      
      this.$emit('message', {
        userId: this.userInfo.userId
      })
    },
    
    // 更多操作
    handleMore() {
      uni.showActionSheet({
        itemList: ['分享', '举报'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 分享用户
            uni.share({
              provider: 'weixin',
              scene: 'WXSceneSession',
              type: 0,
              title: `${this.userInfo.nickname}的Web3社交主页`,
              summary: this.userInfo.bio || '欢迎访问我的Web3社交主页',
              imageUrl: this.userInfo.avatar || this.defaultAvatar,
              href: `https://web3social.example.com/user/${this.userInfo.userId}`
            })
          } else if (res.tapIndex === 1) {
            // 举报用户
            uni.showModal({
              title: '举报用户',
              content: '确定要举报该用户吗？',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  this.$emit('report', {
                    userId: this.userInfo.userId
                  })
                }
              }
            })
          }
        }
      })
    },
    
    // 编辑资料
    handleEdit() {
      uni.navigateTo({
        url: '/pages/user/edit'
      })
    }
  }
}
</script>

<style lang="scss">
.user-info {
  background-color: #fff;
  border-radius: 10rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  
  .user-header {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    
    .user-avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 60rpx;
      margin-right: 20rpx;
    }
    
    .user-basic {
      flex: 1;
      
      .user-nickname {
        font-size: 34rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 5rpx;
        display: block;
      }
      
      .user-username {
        font-size: 26rpx;
        color: #666;
        margin-bottom: 10rpx;
        display: block;
      }
      
      .wallet-info {
        display: flex;
        align-items: center;
        
        .wallet-address {
          display: flex;
          align-items: center;
          background-color: #f5f5f5;
          padding: 6rpx 10rpx;
          border-radius: 6rpx;
          font-size: 24rpx;
          color: #666;
          margin-right: 10rpx;
        }
        
        .chain-badge {
          font-size: 24rpx;
          padding: 4rpx 10rpx;
          border-radius: 6rpx;
          color: #fff;
          
          &.eth {
            background-color: #627eea;
          }
          
          &.sol {
            background-color: #9945ff;
          }
        }
      }
    }
  }
  
  .user-bio {
    font-size: 28rpx;
    color: #333;
    line-height: 1.5;
    margin-bottom: 20rpx;
  }
  
  .user-stats {
    display: flex;
    justify-content: space-between;
    padding: 20rpx 0;
    border-top: 1rpx solid #eee;
    border-bottom: 1rpx solid #eee;
    margin-bottom: 20rpx;
    
    .stat-item {
      flex: 1;
      text-align: center;
      
      .stat-value {
        font-size: 30rpx;
        font-weight: bold;
        color: #333;
        display: block;
        margin-bottom: 5rpx;
      }
      
      .stat-label {
        font-size: 24rpx;
        color: #999;
      }
    }
    
    .divider {
      width: 1rpx;
      height: 40rpx;
      background-color: #eee;
      margin-top: 10rpx;
    }
  }
  
  .user-actions {
    display: flex;
    margin-top: 20rpx;
    
    .action-btn {
      margin: 0;
      padding: 0;
      line-height: 64rpx;
      height: 64rpx;
      font-size: 28rpx;
      border-radius: 32rpx;
    }
    
    .follow-btn {
      flex: 3;
      background-color: #3cc51f;
      color: #fff;
      
      &.followed {
        background-color: #f5f5f5;
        color: #666;
      }
    }
    
    .message-btn {
      flex: 2;
      background-color: #f5f5f5;
      color: #333;
      margin-left: 20rpx;
    }
    
    .more-btn {
      width: 64rpx;
      flex: none;
      margin-left: 20rpx;
      background-color: #f5f5f5;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  
  .edit-action {
    margin-top: 20rpx;
    
    .edit-btn {
      margin: 0;
      padding: 0;
      line-height: 64rpx;
      height: 64rpx;
      font-size: 28rpx;
      border-radius: 32rpx;
      background-color: #f5f5f5;
      color: #333;
    }
  }
}
</style> 