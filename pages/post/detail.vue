<template>
  <view class="post-detail-page">
    <!-- 顶部导航栏 -->
    <view class="page-header">
      <view class="back-button" @click="goBack">
        <uni-icons type="back" size="24"></uni-icons>
      </view>
      <text class="page-title">帖子详情</text>
      <view class="more-button" @click="showActionSheet">
        <uni-icons type="more-filled" size="24"></uni-icons>
      </view>
    </view>
    
    <!-- 帖子内容 -->
    <scroll-view 
      class="post-content-scroll" 
      scroll-y 
      @scrolltolower="loadMoreComments"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="loading" class="loading-container">
        <uni-load-more status="loading" :contentText="{ contentrefresh: '加载中...' }"></uni-load-more>
      </view>
      
      <view v-else-if="!post" class="error-container">
        <uni-icons type="info" size="40" color="#ddd"></uni-icons>
        <text class="error-text">帖子不存在或已被删除</text>
        <button class="back-btn" @click="goBack">返回</button>
      </view>
      
      <block v-else>
        <!-- 帖子详情 -->
        <view class="post-detail">
          <!-- 作者信息 -->
          <view class="author-info" @click="goToUserProfile">
            <image class="avatar" :src="post.author.avatar || defaultAvatar"></image>
            <view class="author-meta">
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
                  @click="previewImage(index)"
                ></image>
              </view>
            </view>
            
            <!-- 交易信息展示 -->
            <view class="transaction-info" v-if="post.transactionInfo">
              <uni-icons type="paperplane" size="16" color="#3cc51f"></uni-icons>
              <text class="tx-text">
                交易哈希: {{ formatTxHash(post.transactionInfo.hash) }}
              </text>
              <text class="tx-link" @click="openTransaction">查看</text>
            </view>
            
            <!-- 标签展示 -->
            <view class="post-tags" v-if="post.tags && post.tags.length > 0">
              <text 
                v-for="(tag, index) in post.tags" 
                :key="index"
                class="tag"
                @click="goToTag(tag)"
              >
                #{{ tag }}
              </text>
            </view>
          </view>
          
          <!-- 帖子操作栏 -->
          <view class="post-actions">
            <view class="action-item" @click="handleLike">
              <uni-icons 
                :type="post.isLiked ? 'heart-filled' : 'heart'" 
                size="20" 
                :color="post.isLiked ? '#ff4d4f' : '#999'"
              ></uni-icons>
              <text class="action-text" :class="{'liked': post.isLiked}">
                {{ post.likeCount || 0 }}
              </text>
            </view>
            
            <view class="action-item" @click="focusCommentInput">
              <uni-icons type="chat" size="20" color="#999"></uni-icons>
              <text class="action-text">{{ post.commentCount || 0 }}</text>
            </view>
            
            <view class="action-item" @click="handleShare">
              <uni-icons type="redo" size="20" color="#999"></uni-icons>
              <text class="action-text">分享</text>
            </view>
          </view>
        </view>
        
        <!-- 评论区 -->
        <view class="comments-section">
          <view class="section-header">
            <text class="section-title">评论 ({{ post.commentCount || 0 }})</text>
            <text class="view-all" @click="goToCommentList" v-if="post.commentCount > 3">查看全部</text>
          </view>
          
          <view v-if="loadingComments" class="loading-container">
            <uni-load-more status="loading" :contentText="{ contentrefresh: '加载评论中...' }"></uni-load-more>
          </view>
          
          <view v-else-if="comments.length === 0" class="empty-container">
            <text class="empty-text">暂无评论，快来发表第一条评论吧</text>
          </view>
          
          <view v-else class="comment-list">
            <comment-item 
              v-for="comment in comments" 
              :key="comment.id" 
              :comment="comment"
              :isAdmin="isAdmin"
              @reply="handleReply"
              @like="handleCommentLike"
            ></comment-item>
            
            <view class="view-more" @click="goToCommentList" v-if="post.commentCount > comments.length">
              <text class="view-more-text">查看全部{{ post.commentCount }}条评论</text>
            </view>
          </view>
        </view>
      </block>
    </scroll-view>
    
    <!-- 评论输入框 -->
    <view class="comment-input-container">
      <input 
        class="comment-input" 
        type="text" 
        v-model="commentContent" 
        placeholder="发表评论..."
        :focus="inputFocus"
        @blur="inputFocus = false"
      />
      <button 
        class="send-btn" 
        :disabled="!commentContent.trim()" 
        @click="submitComment"
      >发送</button>
    </view>
    
    <!-- 回复弹窗 -->
    <uni-popup ref="replyPopup" type="bottom">
      <view class="reply-popup">
        <view class="reply-header">
          <text class="reply-title">回复: {{ replyTo ? replyTo.author.nickname : '' }}</text>
          <uni-icons type="close" size="20" @click="closeReplyPopup"></uni-icons>
        </view>
        
        <view class="reply-input-container">
          <input 
            class="reply-input" 
            type="text" 
            v-model="replyContent" 
            placeholder="回复评论..."
            focus
          />
          <button 
            class="send-btn" 
            :disabled="!replyContent.trim()" 
            @click="submitReply"
          >回复</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import CommentItem from '@/components/comment-item/comment-item'
import { formatAddress, formatRelativeTime, formatTxHash } from '@/utils/format'

export default {
  components: {
    CommentItem
  },
  
  data() {
    return {
      postId: '', // 帖子ID
      post: null, // 帖子数据
      comments: [], // 评论列表
      loading: true, // 加载状态
      loadingComments: true, // 评论加载状态
      refreshing: false, // 刷新状态
      commentContent: '', // 评论内容
      inputFocus: false, // 输入框是否聚焦
      replyTo: null, // 回复的评论
      replyContent: '', // 回复内容
      defaultAvatar: '/static/images/default-avatar.png'
    }
  },
  
  computed: {
    ...mapState('user', ['userInfo']),
    
    // 是否是管理员
    isAdmin() {
      return this.userInfo && this.userInfo.role === 'admin'
    }
  },
  
  onLoad(options) {
    if (options.id) {
      this.postId = options.id
      this.loadPostData()
    } else {
      uni.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  },
  
  methods: {
    ...mapActions('post', ['getPostDetail', 'likePost', 'getComments', 'addComment', 'addReply', 'likeComment']),
    
    // 返回上一页
    goBack() {
      uni.navigateBack()
    },
    
    // 加载帖子数据
    async loadPostData() {
      this.loading = true
      try {
        const result = await this.getPostDetail(this.postId)
        this.post = result
        this.loadComments()
      } catch (error) {
        console.error('加载帖子数据失败：', error)
        uni.showToast({
          title: '加载帖子数据失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 加载评论
    async loadComments() {
      this.loadingComments = true
      try {
        const result = await this.getComments({
          postId: this.postId,
          page: 1,
          pageSize: 3 // 只加载前3条评论
        })
        
        this.comments = result.list
      } catch (error) {
        console.error('加载评论失败：', error)
      } finally {
        this.loadingComments = false
      }
    },
    
    // 加载更多评论
    loadMoreComments() {
      // 在评论列表页面实现加载更多
      if (this.post && this.post.commentCount > this.comments.length) {
        this.goToCommentList()
      }
    },
    
    // 下拉刷新
    async onRefresh() {
      this.refreshing = true
      await this.loadPostData()
      this.refreshing = false
    },
    
    // 格式化地址
    formatAddress(address) {
      return formatAddress(address)
    },
    
    // 格式化相对时间
    formatRelativeTime(time) {
      return formatRelativeTime(time)
    },
    
    // 格式化交易哈希
    formatTxHash(hash) {
      return formatTxHash(hash)
    },
    
    // 获取图片网格样式
    getImageGridClass(count) {
      if (count === 1) return 'single-image'
      if (count === 2) return 'double-image'
      if (count === 3) return 'triple-image'
      if (count === 4) return 'quad-image'
      return 'multi-image'
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
      if (!this.post.transactionInfo || !this.post.transactionInfo.hash) return
      
      // 根据当前网络类型打开对应的区块浏览器
      let url = ''
      if (this.post.transactionInfo.network === 'solana') {
        url = `https://explorer.solana.com/tx/${this.post.transactionInfo.hash}`
      } else {
        // 默认以太坊
        url = `https://etherscan.io/tx/${this.post.transactionInfo.hash}`
      }
      
      // 打开浏览器
      uni.setClipboardData({
        data: this.post.transactionInfo.hash,
        success: () => {
          uni.showModal({
            title: '交易哈希已复制',
            content: '是否打开浏览器查看交易详情？',
            confirmText: '打开',
            success: (res) => {
              if (res.confirm) {
                // #ifdef H5
                window.open(url)
                // #endif
                
                // #ifdef APP-PLUS
                plus.runtime.openURL(url);
                // #endif