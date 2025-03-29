<template>
  <view class="comment-list-page">
    <!-- 顶部导航栏 -->
    <view class="page-header">
      <view class="back-button" @click="goBack">
        <uni-icons type="back" size="24"></uni-icons>
      </view>
      <text class="page-title">评论列表</text>
    </view>
    
    <!-- 原帖内容 -->
    <view class="original-post" v-if="post">
      <post-card :post="post" :showActions="false"></post-card>
    </view>
    
    <!-- 评论列表 -->
    <view class="comments-container">
      <view v-if="loading" class="loading-container">
        <uni-load-more status="loading" :contentText="{ contentrefresh: '加载中...' }"></uni-load-more>
      </view>
      
      <view v-else-if="comments.length === 0" class="empty-container">
        <uni-icons type="chat" size="40" color="#ddd"></uni-icons>
        <text class="empty-text">暂无评论，快来发表第一条评论吧</text>
      </view>
      
      <view v-else class="comment-list">
        <comment-item 
          v-for="comment in comments" 
          :key="comment.id" 
          :comment="comment"
          :isAdmin="isAdmin"
          @reply="handleReply"
          @like="handleLike"
        ></comment-item>
      </view>
      
      <!-- 加载更多 -->
      <uni-load-more v-if="comments.length > 0 && hasMore" status="loading" :contentText="{ contentrefresh: '加载更多...' }"></uni-load-more>
      <uni-load-more v-if="comments.length > 0 && !hasMore" status="noMore" :contentText="{ contentnomore: '没有更多评论了' }"></uni-load-more>
    </view>
    
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
import PostCard from '@/components/post-card/post-card'
import CommentItem from '@/components/comment-item/comment-item'

export default {
  components: {
    PostCard,
    CommentItem
  },
  
  data() {
    return {
      postId: '', // 帖子ID
      post: null, // 帖子数据
      comments: [], // 评论列表
      loading: true, // 加载状态
      hasMore: false, // 是否有更多评论
      page: 1, // 当前页码
      pageSize: 10, // 每页评论数
      commentContent: '', // 评论内容
      inputFocus: false, // 输入框是否聚焦
      replyTo: null, // 回复的评论
      replyContent: '' // 回复内容
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
      this.loadComments()
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
  
  // 下拉刷新
  onPullDownRefresh() {
    this.page = 1
    this.comments = []
    this.loadComments().then(() => {
      uni.stopPullDownRefresh()
    })
  },
  
  // 触底加载更多
  onReachBottom() {
    if (this.hasMore && !this.loading) {
      this.loadMoreComments()
    }
  },
  
  methods: {
    ...mapActions('post', ['getPostDetail']),
    ...mapActions('post', ['getComments', 'addComment', 'addReply', 'likeComment']),
    
    // 返回上一页
    goBack() {
      uni.navigateBack()
    },
    
    // 加载帖子数据
    async loadPostData() {
      try {
        const result = await this.getPostDetail(this.postId)
        this.post = result
      } catch (error) {
        console.error('加载帖子数据失败：', error)
        uni.showToast({
          title: '加载帖子数据失败',
          icon: 'none'
        })
      }
    },
    
    // 加载评论列表
    async loadComments() {
      this.loading = true
      try {
        const result = await this.getComments({
          postId: this.postId,
          page: this.page,
          pageSize: this.pageSize
        })
        
        this.comments = result.list
        this.hasMore = result.total > this.comments.length
      } catch (error) {
        console.error('加载评论失败：', error)
        uni.showToast({
          title: '加载评论失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 加载更多评论
    async loadMoreComments() {
      if (this.loading || !this.hasMore) return
      
      this.loading = true
      this.page += 1
      
      try {
        const result = await this.getComments({
          postId: this.postId,
          page: this.page,
          pageSize: this.pageSize
        })
        
        this.comments = [...this.comments, ...result.list]
        this.hasMore = result.total > this.comments.length
      } catch (error) {
        console.error('加载更多评论失败：', error)
        this.page -= 1
      } finally {
        this.loading = false
      }
    },
    
    // 提交评论
    async submitComment() {
      if (!this.commentContent.trim()) return
      
      try {
        const comment = await this.addComment({
          postId: this.postId,
          content: this.commentContent
        })
        
        // 添加到评论列表顶部
        this.comments.unshift(comment)
        
        // 清空输入框
        this.commentContent = ''
        
        // 更新帖子评论数
        if (this.post) {
          this.post.commentCount = (this.post.commentCount || 0) + 1
        }
        
        uni.showToast({
          title: '评论成功',
          icon: 'success'
        })
      } catch (error) {
        console.error('提交评论失败：', error)
        uni.showToast({
          title: '评论失败，请重试',
          icon: 'none'
        })
      }
    },
    
    // 处理回复评论
    handleReply(comment) {
      this.replyTo = comment
      this.$refs.replyPopup.open()
    },
    
    // 关闭回复弹窗
    closeReplyPopup() {
      this.$refs.replyPopup.close()
      this.replyContent = ''
      this.replyTo = null
    },
    
    // 提交回复
    async submitReply() {
      if (!this.replyContent.trim() || !this.replyTo) return
      
      try {
        const reply = await this.addReply({
          commentId: this.replyTo.id,
          content: this.replyContent,
          replyToUserId: this.replyTo.author.userId
        })
        
        // 更新评论列表中的回复
        const index = this.comments.findIndex(item => item.id === this.replyTo.id)
        if (index !== -1) {
          if (!this.comments[index].replies) {
            this.comments[index].replies = []
          }
          this.comments[index].replies.push(reply)
        }
        
        // 关闭弹窗并清空内容
        this.closeReplyPopup()
        
        uni.showToast({
          title: '回复成功',
          icon: 'success'
        })
      } catch (error) {
        console.error('提交回复失败：', error)
        uni.showToast({
          title: '回复失败，请重试',
          icon: 'none'
        })
      }
    },
    
    // 处理点赞评论
    async handleLike(comment) {
      try {
        const result = await this.likeComment(comment.id)
        
        // 更新评论点赞状态
        const index = this.comments.findIndex(item => item.id === comment.id)
        if (index !== -1) {
          this.comments[index].isLiked = result.isLiked
          this.comments[index].likeCount = result.likeCount
        }
      } catch (error) {
        console.error('点赞评论失败：', error)
        uni.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        })
      }
    }
  }
}
</script>

<style lang="scss">
.comment-list-page {
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
  }
  
  .original-post {
    margin: 20rpx;
  }
  
  .comments-container {
    flex: 1;
    overflow-y: auto;
    padding: 0 20rpx;
    
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
    }
    
    .comment-list {
      padding-bottom: 120rpx;
    }
  }
  
  .comment-input-container {
    display: flex;
    align-items: center;
    padding: 20rpx;
    background-color: #fff;
    border-top: 1px solid #eee;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10;
    
    .comment-input {
      flex: 1;
      height: 70rpx;
      background-color: #f5f5f5;
      border-radius: 35rpx;
      padding: 0 30rpx;
      font-size: 28rpx;
    }
    
    .send-btn {
      margin-left: 20rpx;
      background-color: #3cc51f;
      color: #fff;
      font-size: 28rpx;
      padding: 0 30rpx;
      height: 70rpx;
      line-height: 70rpx;
      border-radius: 35rpx;
      
      &:disabled {
        background-color: #ccc;
      }
    }
  }
  
  .reply-popup {
    background-color: #fff;
    padding: 30rpx;
    border-top-left-radius: 20rpx;
    border-top-right-radius: 20rpx;
    
    .reply-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;
      
      .reply-title {
        font-size: 30rpx;
        font-weight: bold;
      }
    }
    
    .reply-input-container {
      display: flex;
      align-items: center;
      
      .reply-input {
        flex: 1;
        height: 70rpx;
        background-color: #f5f5f5;
        border-radius: 35rpx;
        padding: 0 30rpx;
        font-size: 28rpx;
      }
      
      .send-btn {
        margin-left: 20rpx;
        background-color: #3cc51f;
        color: #fff;
        font-size: 28rpx;
        padding: 0 30rpx;
        height: 70rpx;
        line-height: 70rpx;
        border-radius: 35rpx;
        
        &:disabled {
          background-color: #ccc;
        }
      }
    }
  }
}
</style>