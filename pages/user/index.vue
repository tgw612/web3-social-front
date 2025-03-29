<template>
  <view class="user-profile-page">
    <!-- 顶部导航栏 -->
    <view class="page-header">
      <view class="back-button" @click="goBack">
        <uni-icons type="back" size="24"></uni-icons>
      </view>
      <text class="page-title">{{ isOwnProfile ? '个人主页' : '用户资料' }}</text>
      <view class="more-button" v-if="isOwnProfile" @click="showActionSheet">
        <uni-icons type="more-filled" size="24"></uni-icons>
      </view>
    </view>
    
    <!-- 用户资料卡片 -->
    <scroll-view 
      class="profile-scroll" 
      scroll-y 
      @scrolltolower="loadMorePosts"
      refresher-enabled
      :refresher-triggered="refreshing">
      @refresherrefresh="onRefresh"
    >
      <view class="profile-card">
        <!-- 用户基本信息 -->
        <view class="user-info">
          <image class="avatar" :src="userProfile.avatar || defaultAvatar" mode="aspectFill"></image>
          
          <view class="user-meta">
            <text class="nickname">{{ userProfile.nickname || '未设置昵称' }}</text>
            <text class="address">{{ formatAddress(userProfile.address) }}</text>
            
            <view class="user-stats">
              <view class="stat-item">
                <text class="stat-value">{{ userProfile.postCount || 0 }}</text>
                <text class="stat-label">帖子</text>
              </view>
              <view class="stat-item">
                <text class="stat-value">{{ userProfile.followingCount || 0 }}</text>
                <text class="stat-label">关注</text>
              </view>
              <view class="stat-item">
                <text class="stat-value">{{ userProfile.followerCount || 0 }}</text>
                <text class="stat-label">粉丝</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 用户简介 -->
        <view class="user-bio" v-if="userProfile.bio">
          <text class="bio-text">{{ userProfile.bio }}</text>
        </view>
        
        <!-- 社交账号 -->
        <view class="social-links" v-if="hasSocialLinks">
          <view class="social-item" v-if="userProfile.social?.twitter" @click="openSocialLink('twitter')">
            <uni-icons type="twitter" size="20" color="#1da1f2"></uni-icons>
            <text class="social-text">{{ userProfile.social.twitter }}</text>
          </view>
          
          <view class="social-item" v-if="userProfile.social?.discord" @click="openSocialLink('discord')">
            <uni-icons type="chat" size="20" color="#7289da"></uni-icons>
            <text class="social-text">{{ userProfile.social.discord }}</text>
          </view>
          
          <view class="social-item" v-if="userProfile.social?.telegram" @click="openSocialLink('telegram')">
            <uni-icons type="paperplane" size="20" color="#0088cc"></uni-icons>
            <text class="social-text">{{ userProfile.social.telegram }}</text>
          </view>
          
          <view class="social-item" v-if="userProfile.website" @click="openWebsite">
            <uni-icons type="link" size="20" color="#666"></uni-icons>
            <text class="social-text">{{ userProfile.website }}</text>
          </view>
        </view>
        
        <!-- 操作按钮 -->
        <view class="action-buttons">
          <button 
            class="primary-btn" 
            v-if="isOwnProfile"
            @click="goToEditProfile"
          >编辑资料</button>
          
          <button 
            class="primary-btn" 
            v-else-if="!isFollowing"
            @click="followUser"
          >关注</button>
          
          <button 
            class="outlined-btn" 
            v-else
            @click="handleUnfollow"
          >已关注</button>
          
          <button 
            class="outlined-btn" 
            v-if="!isOwnProfile"
            @click="sendMessage"
          >发消息</button>
        </view>
      </view>
      
      <!-- 资产展示 -->
      <view class="assets-section" v-if="showAssets && userAssets">
        <view class="section-header">
          <text class="section-title">资产概览</text>
          <text class="view-more" @click="goToAssetPage">查看详情</text>
        </view>
        
        <view class="asset-card">
          <view class="asset-info">
            <view class="total-value">
              <text class="value-text">{{ formatTotalValue(userAssets.totalValue) }}</text>
              <text class="value-label">总资产价值</text>
            </view>
            
            <view class="asset-stats">
              <view class="stat-item">
                <text class="stat-value">{{ userAssets.tokenCount || 0 }}</text>
                <text class="stat-label">代币数量</text>
              </view>
              <view class="stat-item">
                <text class="stat-value">{{ userAssets.nftCount || 0 }}</text>
                <text class="stat-label">NFT数量</text>
              </view>
            </view>
          </view>
          
          <!-- 资产分布图表 -->
          <view class="asset-chart-container" v-if="userAssets.distribution && userAssets.distribution.length > 0">
            <asset-chart 
              :chartData="userAssets.distribution" 
              type="ring" 
              :height="220" 
              title="资产分布"
            ></asset-chart>
          </view>
        </view>
      </view>
      
      <!-- 用户帖子 -->
      <view class="posts-section">
        <view class="section-header">
          <text class="section-title">发布的内容</text>
        </view>
        
        <view v-if="loadingPosts" class="loading-container">
          <uni-load-more status="loading" :contentText="{ contentrefresh: '加载中...' }"></uni-load-more>
        </view>
        
        <view v-else-if="userPosts.length === 0" class="empty-container">
          <uni-icons type="chat" size="40" color="#ddd"></uni-icons>
          <text class="empty-text">暂无发布的内容</text>
        </view>
        
        <view v-else class="post-list">
          <post-card 
            v-for="post in userPosts" 
            :key="post.id" 
            :post="post"
            @click="goToPostDetail(post.id)"
          ></post-card>
          
          <!-- 加载更多 -->
          <uni-load-more v-if="hasMorePosts" status="loading" :contentText="{ contentrefresh: '加载更多...' }"></uni-load-more>
          <uni-load-more v-else status="noMore" :contentText="{ contentnomore: '没有更多内容了' }"></uni-load-more>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import PostCard from '@/components/post-card/post-card'
import AssetChart from '@/components/asset-chart/asset-chart'
import { formatAddress } from '@/utils/format'

export default {
  components: {
    PostCard,
    AssetChart
  },
  
  data() {
    return {
      userId: '', // 用户ID
      userProfile: {}, // 用户资料
      userAssets: null, // 用户资产
      userPosts: [], // 用户帖子
      isFollowing: false, // 是否已关注
      loadingProfile: true, // 加载用户资料状态
      loadingPosts: true, // 加载帖子状态
      refreshing: false, // 刷新状态
      hasMorePosts: false, // 是否有更多帖子
      page: 1, // 当前页码
      pageSize: 10, // 每页数量
      defaultAvatar: '/static/images/default-avatar.png' // 默认头像
    }
  },
  
  computed: {
    ...mapState('user', ['userInfo']),
    
    // 是否是自己的资料页
    isOwnProfile() {
      return !this.userId || (this.userInfo && this.userInfo.userId === this.userId)
    },
    
    // 是否有社交账号
    hasSocialLinks() {
      return (
        (this.userProfile.social && (
          this.userProfile.social.twitter ||
          this.userProfile.social.discord ||
          this.userProfile.social.telegram
        )) ||
        this.userProfile.website
      )
    },
    
    // 是否显示资产
    showAssets() {
      // 如果是自己的资料页，或者用户设置了公开资产
      return this.isOwnProfile || (this.userProfile.settings && this.userProfile.settings.showAssets !== false)
    }
  },
  
  onLoad(options) {
    if (options.id) {
      this.userId = options.id
    }
    
    this.loadUserProfile()
    this.loadUserPosts()
  },
  
  methods: {
    ...mapActions('user', ['getUserProfile', 'followUser', 'unfollowUser']),
    ...mapActions('asset', ['getUserAssets']),
    ...mapActions('post', ['getUserPosts']),
    
    // 返回上一页
    goBack() {
      uni.navigateBack()
    },
    
    // 格式化地址
    formatAddress(address) {
      return formatAddress(address)
    },
    
    // 格式化总资产价值
    formatTotalValue(value) {
      if (!value && value !== 0) return '$0.00'
      return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    
    // 加载用户资料
    async loadUserProfile() {
      this.loadingProfile = true
      try {
        // 获取用户资料
        const profile = await this.getUserProfile(this.userId || '')
        this.userProfile = profile
        
        // 检查是否已关注该用户
        if (!this.isOwnProfile && this.userInfo) {
          this.isFollowing = profile.isFollowing || false
        }
        
        // 获取用户资产
        if (this.showAssets) {
          this.loadUserAssets()
        }
      } catch (error) {
        console.error('加载用户资料失败：', error)
        uni.showToast({
          title: '加载用户资料失败',
          icon: 'none'
        })
      } finally {
        this.loadingProfile = false
      }
    },
    
    // 加载用户资产
    async loadUserAssets() {
      try {
        this.userAssets = await this.getUserAssets(this.userId || '')
      } catch (error) {
        console.error('加载用户资产失败：', error)
      }
    },
    
    // 加载用户帖子
    async loadUserPosts() {
      this.loadingPosts = true
      try {
        const result = await this.getUserPosts({
          userId: this.userId || '',
          page: this.page,
          pageSize: this.pageSize
        })
        
        this.userPosts = result.list
        this.hasMorePosts = result.total > this.userPosts.length
      } catch (error) {
        console.error('加载用户帖子失败：', error)
      } finally {
        this.loadingPosts = false
      }
    },
    
    // 加载更多帖子
    async loadMorePosts() {
      if (this.loadingPosts || !this.hasMorePosts) return
      
      this.loadingPosts = true
      this.page += 1
      
      try {
        const result = await this.getUserPosts({
          userId: this.userId || '',
          page: this.page,
          pageSize: this.pageSize
        })
        
        this.userPosts = [...this.userPosts, ...result.list]
        this.hasMorePosts = result.total > this.userPosts.length
      } catch (error) {
        console.error('加载更多帖子失败：', error)
        this.page -= 1
      } finally {
        this.loadingPosts = false
      }
    },
    
    // 下拉刷新
    async onRefresh() {
      this.refreshing = true
      this.page = 1
      await Promise.all([this.loadUserProfile(), this.loadUserPosts()])
      this.refreshing = false
    },
    
    // 跳转到编辑资料页面
    goToEditProfile() {
      uni.navigateTo({
        url: '/pages/user/edit'
      })
    },
    
    // 跳转到资产页面
    goToAssetPage() {
      uni.navigateTo({
        url: this.isOwnProfile ? '/pages/asset/index' : `/pages/asset/index?userId=${this.userId}`
      })
    },
    
    // 跳转到帖子详情页
    goToPostDetail(postId) {
      uni.navigateTo({
        url: `/pages/post/detail?id=${postId}`
      })
    },
    
    // 关注用户
    async followUser() {
      if (!this.userInfo) {
        uni.showModal({
          title: '提示',
          content: '请先登录后再关注用户',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
                url: '/pages/wallet/connect'
              })
            }
          }
        })
        return
      }
      
      try {
        await this.followUser(this.userId)
        this.isFollowing = true
        this.userProfile.followerCount = (this.userProfile.followerCount || 0) + 1
        
        uni.showToast({
          title: '关注成功',
          icon: 'success'
        })
      } catch (error) {
        console.error('关注用户失败：', error)
        uni.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        })
      }
    },
    
    // 取消关注用户
    async handleUnfollow() {
      try {
        await this.unfollowUser(this.userId)
        this.isFollowing = false
        this.userProfile.followerCount = Math.max((this.userProfile.followerCount || 0) - 1, 0)
        
        uni.showToast({
          title: '已取消关注',
          icon: 'success'
        })
      } catch (error) {
        console.error('取消关注用户失败：', error)
        uni.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        })
      }
    },
    
    // 发送消息
    sendMessage() {
      if (!this.userInfo) {
        uni.showModal({
          title: '提示',
          content: '请先登录后再发送消息',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
                url: '/pages/wallet/connect'
              })
            }
          }
        })
        return
      }
      
      // 跳转到聊天页面（如果有的话）
      uni.showToast({
        title: '消息功能开发中',
        icon: 'none'
      })
    },
    
    // 打开社交链接
    openSocialLink(type) {
      let url = ''
      
      switch (type) {
        case 'twitter':
          url = `https://twitter.com/${this.userProfile.social.twitter}`
          break
        case 'discord':
          // Discord通常没有直接的个人资料链接
          uni.setClipboardData({
            data: this.userProfile.social.discord,
            success: () => {
              uni.showToast({
                title: 'Discord ID已复制',
                icon: 'success'
              })
            }
          })
          return
        case 'telegram':
          url = `https://t.me/${this.userProfile.social.telegram}`
          break
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
    
    // 打开网站
    openWebsite() {
      if (!this.userProfile.website) return
      
      let url = this.userProfile.website
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url
      }
      
      // #ifdef H5
      window.open(url)
      // #endif
      
      // #ifdef APP-PLUS
      plus.runtime.openURL(url)
      // #endif
    },
    
    // 显示操作菜单
    showActionSheet() {
      uni.showActionSheet({
        itemList: ['分享个人主页', '退出登录'],
        success: (res) => {
          switch (res.tapIndex) {
            case 0: // 分享
              this.shareProfile()
              break
            case 1: // 退出登录
              this.logout()
              break
          }
        }
      })
    },
    
    // 分享个人主页
    shareProfile() {
      uni.showToast({
        title: '分享功能开发中',
        icon: 'none'
      })
    },
    
    // 退出登录
    logout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 调用退出登录接口
            this.$store.dispatch('user/logout')
            
            // 返回首页
            uni.switchTab({
              url: '/pages/index/index'
            })
          }
        }
      })
    }
  }
}
</script>

<style lang="scss">
.user-profile-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
  
  .page-header {
    display: flex;
    align-items: center;
    padding: 20rpx 30rpx;
    background-color: #fff;
    position: relative;
    
    .back-button {
      position: absolute;
      left: 30rpx;
    }
    
    .page-title {
      flex: 1;
      text-align: center;
      font-size: 32rpx;
      font-weight: bold;
    }
    
    .more-button {
      position: absolute;
      right: 30rpx;
    }
  }
  
  .profile-scroll {
    flex: 1;
  }
  
  .profile-card {
    margin: 20rpx;
    background-color: #fff;
    border-radius: 12rpx;
    padding: 30rpx;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
    
    .user-info {
      display: flex;
      align-items: center;
      
      .avatar {
        width: 150rpx;
        height: 150rpx;
        border-radius: 50%;
        margin-right: 30rpx;
      }
      
      .user-meta {
        flex: 1;
        
        .nickname {
          font-size: 36rpx;
          font-weight: bold;
          margin-bottom: 10rpx;
        }
        
        .address {
          font-size: 26rpx;
          color: #666;
          margin-bottom: 20rpx;
        }
        
        .user-stats {
          display: flex;
          
          .stat-item {
            margin-right: 40rpx;
            
            .stat-value {
              font-size: 30rpx;
              font-weight: bold;
              margin-right: 8rpx;
            }
            
            .stat-label {
              font-size: 26rpx;
              color: #666;
            }
          }
        }
      }
    }
    
    .user-bio {
      margin-top: 30rpx;
      padding-top: 20rpx;
      border-top: 1px solid #eee;
      
      .bio-text {
        font-size: 28rpx;
        color: #333;
        line-height: 1.5;
      }
    }
    
    .social-links {
      margin-top: 30rpx;
      display: flex;
      flex-wrap: wrap;
      
      .social-item {
        display: flex;
        align-items: center;
        margin-right: 30rpx;
        margin-bottom: 15rpx;
        
        .social-text {
          font-size: 26rpx;
          color: #666;
          margin-left: 10rpx;
        }
      }
    }
    
    .action-buttons {
      margin-top: 30rpx;
      display: flex;
      
      button {
        flex: 1;
        margin: 0 10rpx;
        font-size: 28rpx;
        height: 70rpx;
        line-height: 70rpx;
        
        &:first-child {
          margin-left: 0;
        }
        
        &:last-child {
          margin-right: 0;
        }
      }
      
      .primary-btn {
        background-color: #3cc51f;
        color: #fff;
        border-radius: 35rpx;
      }
      
      .outlined-btn {
        background-color: #fff;
        color: #3cc51f;
        border: 1px solid #3cc51f;
        border-radius: 35rpx;
      }
    }
  }
  
  .assets-section,
  .posts-section {
    margin: 20rpx;
    background-color: #fff;
    border-radius: 12rpx;
    padding: 20rpx;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10rpx;
      margin-bottom: 20rpx;
      
      .section-title {
        font-size: 32rpx;
        font-weight: bold;
      }
      
      .view-more {
        font-size: 26rpx;
        color: #3cc51f;
      }
    }
  }
  
  .asset-card {
    .asset-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30rpx;
      
      .total-value {
        .value-text {
          font-size: 40rpx;
          font-weight: bold;
          color: #3cc51f;
        }
        
        .value-label {
          font-size: 24rpx;
          color: #666;
          margin-left: 10rpx;
        }
      }
      
      .asset-stats {
        display: flex;
        
        .stat-item {
          margin-left: 30rpx;
          text-align: center;
          
          .stat-value {
            font-size: 30rpx;
            font-weight: bold;
          }
          
          .stat-label {
            font-size: 24rpx;
            color: #666;
          }
        }
      }
    }
  }
  
  .loading-container,
  .empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50rpx 0;
    
    .empty-text {
      margin-top: 20rpx;
      color: #999;
      font-size: 28rpx;
    }
  }
  
  .post-list {
    .post-card {
      margin-bottom: 20rpx;
    }
  }
}
</style>