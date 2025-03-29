<template>
  <view class="post-index-page">
    <!-- 顶部导航栏 -->
    <view class="page-header">
      <text class="page-title">社区广场</text>
      <view class="create-button" @click="goToCreatePost">
        <uni-icons type="plusempty" size="24"></uni-icons>
      </view>
    </view>
    
    <!-- 帖子列表 -->
    <scroll-view 
      class="post-list-scroll" 
      scroll-y 
      @scrolltolower="loadMorePosts"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 筛选栏 -->
      <view class="filter-bar">
        <view 
          class="filter-item" 
          :class="{active: currentFilter === 'latest'}"
          @click="changeFilter('latest')"
        >
          <text class="filter-text">最新</text>
        </view>
        <view 
          class="filter-item" 
          :class="{active: currentFilter === 'hot'}"
          @click="changeFilter('hot')"
        >
          <text class="filter-text">热门</text>
        </view>
        <view 
          class="filter-item" 
          :class="{active: currentFilter === 'following'}"
          @click="changeFilter('following')"
        >
          <text class="filter-text">关注</text>
        </view>
      </view>
      
      <!-- 加载中 -->
      <view v-if="loading && posts.length === 0" class="loading-container">
        <uni-load-more status="loading" :contentText="{ contentrefresh: '加载中...' }"></uni-load-more>
      </view>
      
      <!-- 空状态 -->
      <view v-else-if="posts.length === 0" class="empty-container">
        <uni-icons type="chat" size="40" color="#ddd"></uni-icons>
        <text class="empty-text">暂无内容</text>
        <button class="create-post-btn" @click="goToCreatePost">发布第一条内容</button>
      </view>
      
      <!-- 帖子列表 -->
      <view v-else class="post-list">
        <post-card 
          v-for="post in posts" 
          :key="post.id" 
          :post="post"
          @click="goToPostDetail(post.id)"
        ></post-card>
      </view>
      
      <!-- 加载更多 -->
      <uni-load-more v-if="loading && posts.length > 0" status="loading" :contentText="{ contentrefresh: '加载更多...' }"></uni-load-more>
      <uni-load-more v-if="!loading && !hasMore && posts.length > 0" status="noMore" :contentText="{ contentnomore: '没有更多内容了' }"></uni-load-more>
    </scroll-view>
    
    <!-- 悬浮发布按钮 -->
    <view class="float-button" @click="goToCreatePost">
      <uni-icons type="plusempty" size="24" color="#fff"></uni-icons>
    </view>
  </view>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import PostCard from '@/components/post-card/post-card'

export default {
  components: {
    PostCard
  },
  
  data() {
    return {
      posts: [], // 帖子列表
      loading: true, // 加载状态
      refreshing: false, // 刷新状态
      hasMore: true, // 是否有更多
      page: 1, // 当前页码
      pageSize: 10, // 每页数量
      currentFilter: 'latest' // 当前筛选：latest-最新，hot-热门，following-关注
    }
  },
  
  computed: {
    ...mapState('user', ['userInfo', 'isLoggedIn'])
  },
  
  onLoad() {
    this.loadPosts()
  },
  
  methods: {
    ...mapActions('post', ['getPosts']),
    
    // 加载帖子列表
    async loadPosts() {
      this.loading = true
      try {
        const result = await this.getPosts({
          filter: this.currentFilter,
          page: this.page,
          pageSize: this.pageSize
        })
        
        this.posts = result.list
        this.hasMore = result.total > this.posts.length
      } catch (error) {
        console.error('加载帖子列表失败：', error)
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 加载更多帖子
    async loadMorePosts() {
      if (this.loading || !this.hasMore) return
      
      this.loading = true
      this.page += 1
      
      try {
        const result = await this.getPosts({
          filter: this.currentFilter,
          page: this.page,
          pageSize: this.pageSize
        })
        
        this.posts = [...this.posts, ...result.list]
        this.hasMore = result.total > this.posts.length
      } catch (error) {
        console.error('加载更多帖子失败：', error)
        this.page -= 1
      } finally {
        this.loading = false
      }
    },
    
    // 下拉刷新
    async onRefresh() {
      this.refreshing = true
      this.page = 1
      await this.loadPosts()
      this.refreshing = false
    },
    
    // 切换筛选条件
    changeFilter(filter) {
      if (filter === 'following' && !this.isLoggedIn) {
        uni.showModal({
          title: '提示',
          content: '请先登录后再查看关注内容',
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
      
      if (this.currentFilter !== filter) {
        this.currentFilter = filter
        this.page = 1
        this.posts = []
        this.loadPosts()
      }
    },
    
    // 跳转到发布帖子页面
    goToCreatePost() {
      if (!this.isLoggedIn) {
        uni.showModal({
          title: '提示',
          content: '请先登录后再发布内容',
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
      
      uni.navigateTo({
        url: '/pages/post/create'
      })
    },
    
    // 跳转到帖子详情页
    goToPostDetail(postId) {
      uni.navigateTo({
        url: `/pages/post/detail?id=${postId}`
      })
    }
  }
}
</script>

<style lang="scss">
.post-index-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
  
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 30rpx;
    background-color: #fff;
    
    .page-title {
      font-size: 32rpx;
      font-weight: bold;
    }
    
    .create-button {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  
  .post-list-scroll {
    flex: 1;
  }
  
  .filter-bar {
    display: flex;
    background-color: #fff;
    padding: 20rpx 30rpx;
    border-bottom: 1px solid #eee;
    
    .filter-item {
      margin-right: 40rpx;
      padding-bottom: 10rpx;
      position: relative;
      
      &.active {
        font-weight: bold;
        
        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 40rpx;
          height: 4rpx;
          background-color: #3cc51f;
          border-radius: 2rpx;
        }
      }
      
      .filter-text {
        font-size: 28rpx;
        color: #333;
      }
    }
  }
  
  .loading-container,
  .empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100rpx 0;
    
    .empty-text {
      margin-top: 20rpx;
      color: #999;
      font-size: 28rpx;
    }
    
    .create-post-btn {
      margin-top: 40rpx;
      background-color: #3cc51f;
      color: #fff;
      font-size: 28rpx;
      padding: 0 30rpx;
      height: 70rpx;
      line-height: 70rpx;
      border-radius: 35rpx;
    }
  }
  
  .post-list {
    padding: 20rpx;
  }
  
  .float-button {
    position: fixed;
    right: 30rpx;
    bottom: 100rpx;
    width: 100rpx;
    height: 100rpx;
    background-color: #3cc51f;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  }
}
</style>