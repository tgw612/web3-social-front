<template>
  <view class="user-edit-page">
    <!-- 顶部导航栏 -->
    <view class="page-header">
      <view class="back-button" @click="goBack">
        <uni-icons type="back" size="24"></uni-icons>
      </view>
      <text class="page-title">编辑资料</text>
      <button class="save-btn" :disabled="!isValid || saving" @click="saveProfile">保存</button>
    </view>
    
    <!-- 编辑表单 -->
    <view class="edit-form">
      <!-- 头像上传 -->
      <view class="avatar-upload">
        <image 
          class="avatar-preview" 
          :src="avatarUrl || defaultAvatar" 
          mode="aspectFill"
          @click="chooseAvatar"
        ></image>
        <text class="upload-text">点击更换头像</text>
      </view>
      
      <!-- 基本信息 -->
      <view class="form-group">
        <view class="form-item">
          <text class="form-label">昵称</text>
          <input 
            class="form-input" 
            type="text" 
            v-model="nickname" 
            placeholder="请输入昵称" 
            maxlength="20"
          />
        </view>
        
        <view class="form-item">
          <text class="form-label">个人简介</text>
          <textarea 
            class="form-textarea" 
            v-model="bio" 
            placeholder="介绍一下自己吧" 
            maxlength="200"
            auto-height
          ></textarea>
          <text class="counter">{{ bio.length }}/200</text>
        </view>
        
        <view class="form-item">
          <text class="form-label">个人网站</text>
          <input 
            class="form-input" 
            type="text" 
            v-model="website" 
            placeholder="请输入个人网站链接" 
          />
        </view>
      </view>
      
      <!-- 社交账号 -->
      <view class="form-group">
        <view class="group-title">社交账号</view>
        
        <view class="form-item">
          <text class="form-label">Twitter</text>
          <input 
            class="form-input" 
            type="text" 
            v-model="twitter" 
            placeholder="请输入Twitter用户名" 
          />
        </view>
        
        <view class="form-item">
          <text class="form-label">Discord</text>
          <input 
            class="form-input" 
            type="text" 
            v-model="discord" 
            placeholder="请输入Discord用户名" 
          />
        </view>
        
        <view class="form-item">
          <text class="form-label">Telegram</text>
          <input 
            class="form-input" 
            type="text" 
            v-model="telegram" 
            placeholder="请输入Telegram用户名" 
          />
        </view>
      </view>
      
      <!-- 隐私设置 -->
      <view class="form-group">
        <view class="group-title">隐私设置</view>
        
        <view class="form-item switch-item">
          <text class="form-label">公开资产信息</text>
          <switch 
            :checked="showAssets" 
            @change="showAssets = $event.detail.value" 
            color="#3cc51f"
          />
        </view>
        
        <view class="form-item switch-item">
          <text class="form-label">接收消息通知</text>
          <switch 
            :checked="receiveNotifications" 
            @change="receiveNotifications = $event.detail.value" 
            color="#3cc51f"
          />
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { uploadToIPFS } from '@/utils/ipfs'

export default {
  data() {
    return {
      nickname: '', // 昵称
      bio: '', // 个人简介
      website: '', // 个人网站
      twitter: '', // Twitter
      discord: '', // Discord
      telegram: '', // Telegram
      avatarUrl: '', // 头像URL
      avatarFile: null, // 头像文件
      showAssets: true, // 是否公开资产
      receiveNotifications: true, // 是否接收通知
      defaultAvatar: '/static/images/default-avatar.png', // 默认头像
      saving: false // 是否正在保存
    }
  },
  
  computed: {
    ...mapState('user', ['userInfo']),
    
    // 表单是否有效
    isValid() {
      return this.nickname.trim().length > 0
    }
  },
  
  onLoad() {
    // 检查用户是否已登录
    if (!this.userInfo || !this.userInfo.address) {
      uni.showModal({
        title: '提示',
        content: '请先连接钱包后再编辑资料',
        showCancel: false,
        success: () => {
          uni.navigateTo({
            url: '/pages/wallet/connect'
          })
        }
      })
      return
    }
    
    // 加载用户资料
    this.loadUserProfile()
  },
  
  methods: {
    ...mapActions('user', ['getUserProfile', 'updateUserProfile']),
    
    // 返回上一页
    goBack() {
      uni.navigateBack()
    },
    
    // 加载用户资料
    async loadUserProfile() {
      try {
        const profile = await this.getUserProfile()
        
        // 填充表单数据
        this.nickname = profile.nickname || ''
        this.bio = profile.bio || ''
        this.website = profile.website || ''
        this.twitter = profile.social?.twitter || ''
        this.discord = profile.social?.discord || ''
        this.telegram = profile.social?.telegram || ''
        this.avatarUrl = profile.avatar || ''
        this.showAssets = profile.settings?.showAssets !== false
        this.receiveNotifications = profile.settings?.receiveNotifications !== false
      } catch (error) {
        console.error('加载用户资料失败：', error)
        uni.showToast({
          title: '加载资料失败',
          icon: 'none'
        })
      }
    },
    
    // 选择头像
    chooseAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          // 限制图片大小，不超过2MB
          if (res.tempFiles[0].size > 2 * 1024 * 1024) {
            uni.showToast({
              title: '图片大小不能超过2MB',
              icon: 'none'
            })
            return
          }
          
          this.avatarUrl = res.tempFilePaths[0]
          this.avatarFile = res.tempFiles[0]
        }
      })
    },
    
    // 上传头像到IPFS
    async uploadAvatar() {
      if (!this.avatarFile) return this.avatarUrl
      
      try {
        return await uploadToIPFS(this.avatarUrl)
      } catch (error) {
        console.error('上传头像失败：', error)
        throw new Error('上传头像失败')
      }
    },
    
    // 保存资料
    async saveProfile() {
      if (!this.isValid || this.saving) return
      
      this.saving = true
      uni.showLoading({ title: '保存中...' })
      
      try {
        // 上传头像（如果有新头像）
        let avatarUrl = this.avatarUrl
        if (this.avatarFile) {
          avatarUrl = await this.uploadAvatar()
        }
        
        // 构建用户资料数据
        const profileData = {
          nickname: this.nickname.trim(),
          bio: this.bio.trim(),
          website: this.website.trim(),
          avatar: avatarUrl,
          social: {
            twitter: this.twitter.trim(),
            discord: this.discord.trim(),
            telegram: this.telegram.trim()
          },
          settings: {
            showAssets: this.showAssets,
            receiveNotifications: this.receiveNotifications
          }
        }
        
        // 更新用户资料
        await this.updateUserProfile(profileData)
        
        uni.hideLoading()
        uni.showToast({
          title: '保存成功',
          icon: 'success'
        })
        
        // 返回上一页
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      } catch (error) {
        console.error('保存资料失败：', error)
        uni.hideLoading()
        uni.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        })
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style lang="scss">
.user-edit-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
  
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 30rpx;
    background-color: #fff;
    
    .back-button {
      width: 60rpx;
    }
    
    .page-title {
      font-size: 32rpx;
      font-weight: bold;
    }
    
    .save-btn {
      background-color: #3cc51f;
      color: #fff;
      font-size: 28rpx;
      padding: 0 30rpx;
      height: 70rpx;
      line-height: 70rpx;
      border-radius: 35rpx;
      margin: 0;
      
      &:disabled {
        background-color: #ccc;
      }
    }
  }
  
  .edit-form {
    padding: 30rpx;
    
    .avatar-upload {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 40rpx;
      
      .avatar-preview {
        width: 160rpx;
        height: 160rpx;
        border-radius: 50%;
        margin-bottom: 20rpx;
      }
      
      .upload-text {
        font-size: 26rpx;
        color: #666;
      }
    }
    
    .form-group {
      background-color: #fff;
      border-radius: 12rpx;
      padding: 20rpx 30rpx;
      margin-bottom: 30rpx;
      
      .group-title {
        font-size: 30rpx;
        font-weight: bold;
        margin-bottom: 20rpx;
      }
      
      .form-item {
        padding: 20rpx 0;
        border-bottom: 1px solid #eee;
        
        &:last-child {
          border-bottom: none;
        }
        
        .form-label {
          font-size: 28rpx;
          color: #333;
          margin-bottom: 15rpx;
          display: block;
        }
        
        .form-input {
          width: 100%;
          height: 70rpx;
          font-size: 28rpx;
        }
        
        .form-textarea {
          width: 100%;
          font-size: 28rpx;
          min-height: 150rpx;
        }
        
        .counter {
          font-size: 24rpx;
          color: #999;
          text-align: right;
          margin-top: 10rpx;
          display: block;
        }
        
        &.switch-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .form-label {
            margin-bottom: 0;
          }
        }
      }
    }
  }
}
</style>