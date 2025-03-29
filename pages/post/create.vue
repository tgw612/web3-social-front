<template>
  <view class="post-create-page">
    <!-- 顶部导航栏 -->
    <view class="page-header">
      <view class="back-button" @click="goBack">
        <uni-icons type="back" size="24"></uni-icons>
      </view>
      <text class="page-title">发布帖子</text>
      <button class="publish-btn" :disabled="!isValid" @click="publishPost">发布</button>
    </view>
    
    <!-- 帖子内容编辑区 -->
    <view class="post-editor">
      <!-- 标题输入 -->
      <input 
        class="post-title-input" 
        type="text" 
        v-model="postTitle" 
        placeholder="标题（选填）" 
        maxlength="50"
      />
      <text class="title-counter">{{ postTitle.length }}/50</text>
      
      <!-- 内容输入 -->
      <textarea 
        class="post-content-input" 
        v-model="postContent" 
        placeholder="分享你的想法..." 
        maxlength="2000"
        auto-height
      ></textarea>
      <text class="content-counter">{{ postContent.length }}/2000</text>
      
      <!-- 图片上传区域 -->
      <view class="image-upload-area">
        <view class="image-list">
          <view 
            class="image-item" 
            v-for="(image, index) in images" 
            :key="index"
          >
            <image class="preview-image" :src="image.path" mode="aspectFill"></image>
            <view class="delete-btn" @click="removeImage(index)">
              <uni-icons type="close" size="20" color="#fff"></uni-icons>
            </view>
          </view>
          
          <view class="upload-button" @click="chooseImage" v-if="images.length < 9">
            <uni-icons type="camera" size="30" color="#999"></uni-icons>
            <text class="upload-text">{{ images.length }}/9</text>
          </view>
        </view>
      </view>
      
      <!-- 标签输入 -->
      <view class="tags-input-area">
        <view class="tags-header">
          <text class="tags-title">添加标签</text>
          <text class="tags-tip">最多添加5个标签</text>
        </view>
        
        <view class="tags-list">
          <view 
            class="tag-item" 
            v-for="(tag, index) in tags" 
            :key="index"
          >
            <text class="tag-text">#{{ tag }}</text>
            <view class="tag-delete" @click="removeTag(index)">
              <uni-icons type="close" size="12" color="#666"></uni-icons>
            </view>
          </view>
          
          <input 
            class="tag-input" 
            type="text" 
            v-model="tagInput" 
            placeholder="添加标签" 
            @confirm="addTag"
            v-if="tags.length < 5"
          />
        </view>
      </view>
      
      <!-- 关联交易哈希 -->
      <view class="tx-hash-area">
        <view class="tx-header">
          <text class="tx-title">关联交易哈希（选填）</text>
          <text class="tx-tip">添加交易哈希可以增加内容可信度</text>
        </view>
        
        <input 
          class="tx-input" 
          type="text" 
          v-model="txHash" 
          placeholder="输入交易哈希值" 
        />
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
      postTitle: '', // 帖子标题
      postContent: '', // 帖子内容
      images: [], // 图片列表
      tags: [], // 标签列表
      tagInput: '', // 标签输入
      txHash: '', // 交易哈希
      uploading: false // 是否正在上传
    }
  },
  
  computed: {
    ...mapState('user', ['userInfo']),
    
    // 表单是否有效
    isValid() {
      return this.postContent.trim().length > 0 && !this.uploading
    }
  },
  
  onLoad() {
    // 检查用户是否已登录
    if (!this.userInfo || !this.userInfo.address) {
      uni.showModal({
        title: '提示',
        content: '请先连接钱包后再发布内容',
        showCancel: false,
        success: () => {
          uni.navigateTo({
            url: '/pages/wallet/connect'
          })
        }
      })
    }
  },
  
  methods: {
    ...mapActions('post', ['createPost']),
    
    // 返回上一页
    goBack() {
      uni.navigateBack()
    },
    
    // 选择图片
    chooseImage() {
      uni.chooseImage({
        count: 9 - this.images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          // 限制图片大小，每张不超过2MB
          const validImages = res.tempFiles.filter(file => file.size <= 2 * 1024 * 1024)
          if (validImages.length < res.tempFiles.length) {
            uni.showToast({
              title: '部分图片超过2MB，已自动过滤',
              icon: 'none'
            })
          }
          
          // 添加到图片列表
          this.images = [...this.images, ...validImages.map(file => ({
            path: file.path,
            size: file.size,
            file: file
          }))].slice(0, 9)
        }
      })
    },
    
    // 移除图片
    removeImage(index) {
      this.images.splice(index, 1)
    },
    
    // 添加标签
    addTag() {
      if (!this.tagInput.trim()) return
      
      // 标签格式化：去除#号和空格
      const tag = this.tagInput.trim().replace(/^#/, '')
      
      // 检查是否已存在相同标签
      if (this.tags.includes(tag)) {
        uni.showToast({
          title: '标签已存在',
          icon: 'none'
        })
        return
      }
      
      // 添加标签
      if (this.tags.length < 5) {
        this.tags.push(tag)
        this.tagInput = ''
      }
    },
    
    // 移除标签
    removeTag(index) {
      this.tags.splice(index, 1)
    },
    
    // 上传图片到IPFS
    async uploadImages() {
      if (this.images.length === 0) return []
      
      try {
        const uploadPromises = this.images.map(image => uploadToIPFS(image.path))
        return await Promise.all(uploadPromises)
      } catch (error) {
        console.error('上传图片失败：', error)
        throw new Error('上传图片失败')
      }
    },
    
    // 发布帖子
    async publishPost() {
      if (!this.isValid) return
      
      // 检查用户是否已登录
      if (!this.userInfo || !this.userInfo.address) {
        uni.showModal({
          title: '提示',
          content: '请先连接钱包后再发布内容',
          showCancel: false,
          success: () => {
            uni.navigateTo({
              url: '/pages/wallet/connect'
            })
          }
        })
        return
      }
      
      this.uploading = true
      uni.showLoading({ title: '发布中...' })
      
      try {
        // 上传图片到IPFS
        let imageUrls = []
        if (this.images.length > 0) {
          imageUrls = await this.uploadImages()
        }
        
        // 构建帖子数据
        const postData = {
          title: this.postTitle.trim(),
          content: this.postContent.trim(),
          images: imageUrls,
          tags: this.tags,
          transactionInfo: this.txHash ? { hash: this.txHash.trim() } : null
        }
        
        // 创建帖子
        await this.createPost(postData)
        
        uni.hideLoading()
        uni.showToast({
          title: '发布成功',
          icon: 'success'
        })
        
        // 返回上一页或跳转到社区页
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      } catch (error) {
        console.error('发布帖子失败：', error)
        uni.hideLoading()
        uni.showToast({
          title: '发布失败，请重试',
          icon: 'none'
        })
      } finally {
        this.uploading = false
      }
    }
  }
}
</script>

<style lang="scss">
.post-create-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #fff;
  
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 30rpx;
    border-bottom: 1px solid #eee;
    
    .back-button {
      width: 60rpx;
    }
    
    .page-title {
      font-size: 32rpx;
      font-weight: bold;
    }
    
    .publish-btn {
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
  
  .post-editor {
    flex: 1;
    padding: 30rpx;
    
    .post-title-input {
      width: 100%;
      font-size: 32rpx;
      font-weight: bold;
      padding: 20rpx 0;
      border-bottom: 1px solid #eee;
    }
    
    .title-counter {
      font-size: 24rpx;
      color: #999;
      text-align: right;
      margin: 10rpx 0 20rpx;
    }
    
    .post-content-input {
      width: 100%;
      font-size: 28rpx;
      min-height: 200rpx;
      padding: 20rpx 0;
    }
    
    .content-counter {
      font-size: 24rpx;
      color: #999;
      text-align: right;
      margin: 10rpx 0 30rpx;
    }
    
    .image-upload-area {
      margin-bottom: 40rpx;
      
      .image-list {
        display: flex;
        flex-wrap: wrap;
        
        .image-item {
          width: 220rpx;
          height: 220rpx;
          margin-right: 15rpx;
          margin-bottom: 15rpx;
          position: relative;
          
          .preview-image {
            width: 100%;
            height: 100%;
            border-radius: 8rpx;
          }
          
          .delete-btn {
            position: absolute;
            top: 10rpx;
            right: 10rpx;
            width: 40rpx;
            height: 40rpx;
            background-color: rgba(0, 0, 0, 0.5);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
        
        .upload-button {
          width: 220rpx;
          height: 220rpx;
          border: 1px dashed #ddd;
          border-radius: 8rpx;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          
          .upload-text {
            font-size: 24rpx;
            color: #999;
            margin-top: 10rpx;
          }
        }
      }
    }
    
    .tags-input-area,
    .tx-hash-area {
      margin-bottom: 40rpx;
      
      .tags-header,
      .tx-header {
        margin-bottom: 20rpx;
        
        .tags-title,
        .tx-title {
          font-size: 30rpx;
          font-weight: bold;
        }
        
        .tags-tip,
        .tx-tip {
          font-size: 24rpx;
          color: #999;
          margin-left: 20rpx;
        }
      }
      
      .tags-list {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        
        .tag-item {
          display: flex;
          align-items: center;
          background-color: #f5f5f5;
          border-radius: 30rpx;
          padding: 10rpx 20rpx;
          margin-right: 20rpx;
          margin-bottom: 20rpx;
          
          .tag-text {
            font-size: 26rpx;
            color: #666;
          }
          
          .tag-delete {
            margin-left: 10rpx;
          }
        }
        
        .tag-input {
          font-size: 26rpx;
          padding: 10rpx 0;
          width: 200rpx;
        }
      }
      
      .tx-input {
        width: 100%;
        font-size: 28rpx;
        padding: 20rpx;
        background-color: #f5f5f5;
        border-radius: 8rpx;
      }
    }
  }
}
</style>