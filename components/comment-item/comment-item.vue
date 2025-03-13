<template>
  <view class="comment-item">
    <!-- 评论者头像 -->
    <image 
      class="avatar" 
      :src="comment.author.avatar || defaultAvatar" 
      @click="goToUserProfile"
    ></image>
    
    <!-- 评论内容区域 -->
    <view class="comment-content">
      <!-- 评论作者信息 -->
      <view class="author-info">
        <text class="nickname" @click="goToUserProfile">{{ comment.author.nickname }}</text>
        <text class="address">{{ formatAddress(comment.author.address) }}</text>
        <text class="time">{{ formatRelativeTime(comment.createdAt) }}</text>
      </view>
      
      <!-- 评论文本内容 -->
      <text class="comment-text">{{ comment.content }}</text>
      
      <!-- 评论操作区域 -->
      <view class="comment-actions">
        <view class="action-item" @click="handleLike">
          <uni-icons 
            :type="comment.isLiked ? 'heart-filled' : 'heart'" 
            size="14" 
            :color="comment.isLiked ? '#ff4d4f' : '#999'"
          ></uni-icons>
          <text class="action-text" :class="{'liked': comment.isLiked}">
            {{ comment.likeCount || 0 }}
          </text>
        </view>
        
        <view class="action-item" @click="handleReply">
          <uni-icons type="chat" size="14" color="#999"></uni-icons>
          <text class="action-text">回复</text>
        </view>
        
        <!-- 更多操作，仅当评论属于当前用户或者当前用户是管理员时显示 -->
        <view class="action-item" v-if="isAuthor || isAdmin" @click="handleMore">
          <uni-icons type="more-filled" size="14" color="#999"></uni-icons>
        </view>
      </view>
      
      <!-- 回复评论列表 -->
      <view class="replies" v-if="comment.replies && comment.replies.length > 0">
        <view 
          class="reply-item" 
          v-for="(reply, index) in comment.replies" 
          :key="reply.id || index"
        >
          <view class="reply-header">
            <text class="reply-nickname" @click="goToUserProfile(reply.author.userId)">
              {{ reply.author.nickname }}
            </text>
            <text class="reply-text">回复</text>
            <text class="reply-to-nickname" v-if="reply.replyTo" @click="goToUserProfile(reply.replyTo.userId)">
              {{ reply.replyTo.nickname }}
            </text>
            <text class="reply-time">{{ formatRelativeTime(reply.createdAt) }}</text>
          </view>
          <text class="reply-content">{{ reply.content }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { formatAddress, formatRelativeTime } from '@/utils/format'
import { mapState } from 'vuex'

export default {
  name: 'comment-item',
  
  props: {
    // 评论数据
    comment: {
      type: Object,
      required: true
    },
    
    // 是否为管理员
    isAdmin: {
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
    ...mapState('user', ['userInfo']),
    
    // 是否是评论作者
    isAuthor() {
      return this.userInfo.userId && this.comment.author && this.userInfo.userId === this.comment.author.userId
    }
  },
  
  methods: {
    // 格式化地址
    formatAddress(address) {
      return formatAddress(address)
    },
    
    // 格式化相对时间
    formatRelativeTime(time) {
      return formatRelativeTime(time)
    },
    
    // 处理点赞
    handleLike() {
      this.$emit('like', {
        commentId: this.comment.id,
        isLiked: !this.comment.isLiked
      })
    },
    
    // 处理回复
    handleReply() {
      this.$emit('reply', {
        commentId: this.comment.id,
        author: this.comment.author
      })
    },
    
    // 处理更多操作
    handleMore() {
      uni.showActionSheet({
        itemList: this.isAuthor ? ['删除评论'] : ['举报评论'],
        success: (res) => {
          if (res.tapIndex === 0) {
            if (this.isAuthor) {
              // 删除评论
              uni.showModal({
                title: '删除评论',
                content: '确定要删除这条评论吗？',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    this.$emit('delete', {
                      commentId: this.comment.id
                    })
                  }
                }
              })
            } else {
              // 举报评论
              this.$emit('report', {
                commentId: this.comment.id
              })
            }
          }
        }
      })
    },
    
    // 跳转到用户页面
    goToUserProfile(userId) {
      const targetUserId = userId || (this.comment.author && this.comment.author.userId)
      if (!targetUserId) return
      
      uni.navigateTo({
        url: `/pages/user/index?id=${targetUserId}`
      })
    }
  }
}
</script>

<style lang="scss">
.comment-item {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
  
  .avatar {
    width: 70rpx;
    height: 70rpx;
    border-radius: 35rpx;
    margin-right: 20rpx;
  }
  
  .comment-content {
    flex: 1;
    
    .author-info {
      margin-bottom: 10rpx;
      
      .nickname {
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
        margin-right: 10rpx;
      }
      
      .address {
        font-size: 24rpx;
        color: #999;
        background-color: #f5f5f5;
        padding: 2rpx 8rpx;
        border-radius: 4rpx;
        margin-right: 10rpx;
      }
      
      .time {
        font-size: 24rpx;
        color: #999;
      }
    }
    
    .comment-text {
      font-size: 28rpx;
      color: #333;
      line-height: 1.5;
      margin-bottom: 15rpx;
    }
    
    .comment-actions {
      display: flex;
      margin-bottom: 10rpx;
      
      .action-item {
        display: flex;
        align-items: center;
        margin-right: 30rpx;
        
        .action-text {
          font-size: 24rpx;
          color: #999;
          margin-left: 5rpx;
          
          &.liked {
            color: #ff4d4f;
          }
        }
      }
    }
    
    .replies {
      background-color: #f8f8f8;
      padding: 15rpx;
      border-radius: 6rpx;
      
      .reply-item {
        margin-bottom: 15rpx;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .reply-header {
          margin-bottom: 5rpx;
          
          .reply-nickname {
            font-size: 24rpx;
            color: #3cc51f;
            margin-right: 5rpx;
          }
          
          .reply-text {
            font-size: 24rpx;
            color: #999;
            margin-right: 5rpx;
          }
          
          .reply-to-nickname {
            font-size: 24rpx;
            color: #3cc51f;
            margin-right: 5rpx;
          }
          
          .reply-time {
            font-size: 22rpx;
            color: #999;
          }
        }
        
        .reply-content {
          font-size: 26rpx;
          color: #333;
        }
      }
    }
  }
}
</style> 