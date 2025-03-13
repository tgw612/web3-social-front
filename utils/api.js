import axios from 'axios'

/**
 * API接口服务
 * 所有与后端交互的API统一在此定义
 */
const api = {
  // 用户相关接口
  getUserProfile(address) {
    return request.get(`/api/users/${address}`)
  },
  
  updateUserProfile(data) {
    return request.post('/api/users/profile', data)
  },
  
  // 帖子相关接口
  getPosts({ page = 1, pageSize = 10, sortBy = 'latest' }) {
    return request.get('/api/posts', { params: { page, pageSize, sortBy } })
  },
  
  getUserPosts({ address, page = 1, pageSize = 10 }) {
    return request.get(`/api/users/${address}/posts`, { params: { page, pageSize } })
  },
  
  getPostDetail(id) {
    return request.get(`/api/posts/${id}`)
  },
  
  createPost(data) {
    return request.post('/api/posts', data)
  },
  
  deletePost(id) {
    return request.delete(`/api/posts/${id}`)
  },
  
  // 评论相关接口
  getComments({ postId, page = 1, pageSize = 20 }) {
    return request.get(`/api/posts/${postId}/comments`, { params: { page, pageSize } })
  },
  
  createComment(data) {
    return request.post('/api/comments', data)
  },
  
  // 点赞相关接口
  toggleLike({ postId, userAddress, isLiked }) {
    return request.post('/api/likes', { postId, userAddress, isLiked })
  },
  
  // 资产相关接口
  getUserAssets({ address, networkType = 'ethereum' }) {
    return request.get('/api/assets', { params: { address, networkType } })
  },
  
  getAssetHistory({ address, networkType = 'ethereum', timeRange = '1m' }) {
    return request.get('/api/assets/history', { params: { address, networkType, timeRange } })
  },
  
  // IPFS上传接口
  uploadToIPFS(file) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/api/ipfs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 搜索接口
  search(keyword, type = 'all') {
    return request.get('/api/search', { params: { keyword, type } })
  },
  
  // Web3相关接口
  validateTransaction(txHash, networkType = 'ethereum') {
    return request.get('/api/blockchain/validate-tx', { params: { txHash, networkType } })
  },
  
  // 模拟API - 开发阶段使用
  // 用于在没有真实后端API时模拟数据
  mock: {
    getPosts({ page = 1, pageSize = 10 }) {
      // 生成模拟帖子数据
      const posts = Array(pageSize).fill(0).map((_, index) => ({
        id: `post_${page * pageSize + index}`,
        userAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        username: `user_${Math.floor(Math.random() * 1000)}`,
        userAvatar: '',
        content: `这是第${page * pageSize + index + 1}条模拟帖子内容，用于测试展示效果。`,
        imageUrls: index % 3 === 0 ? [`https://picsum.photos/300/200?random=${index}`] : [],
        createdAt: new Date(Date.now() - Math.random() * 10000000).toISOString(),
        likesCount: Math.floor(Math.random() * 100),
        commentsCount: Math.floor(Math.random() * 30),
        isLiked: Math.random() > 0.5,
        tags: ['DeFi', 'NFT', 'ETH'].filter(() => Math.random() > 0.5)
      }))
      
      return Promise.resolve({
        data: {
          list: posts,
          total: 100,
          page,
          pageSize
        }
      })
    },
    
    getUserAssets({ address }) {
      // 生成模拟资产数据
      const tokens = [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          balance: (Math.random() * 10).toFixed(4),
          value: Math.random() * 20000,
          price: 3000 + Math.random() * 500,
          icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
          change24h: (Math.random() * 10 - 5).toFixed(2)
        },
        {
          symbol: 'USDT',
          name: 'Tether',
          balance: (Math.random() * 10000).toFixed(2),
          value: Math.random() * 10000,
          price: 1,
          icon: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
          change24h: (Math.random() * 1 - 0.5).toFixed(2)
        },
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          balance: (Math.random() * 1).toFixed(6),
          value: Math.random() * 30000,
          price: 60000 + Math.random() * 5000,
          icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
          change24h: (Math.random() * 10 - 5).toFixed(2)
        }
      ]
      
      const nfts = Array(3).fill(0).map((_, index) => ({
        id: `nft_${index}`,
        name: `NFT #${Math.floor(Math.random() * 10000)}`,
        collection: `Collection ${String.fromCharCode(65 + index)}`,
        image: `https://picsum.photos/300/300?random=${index}`,
        floorPrice: (Math.random() * 10).toFixed(3)
      }))
      
      const totalValue = tokens.reduce((sum, token) => sum + token.value, 0)
      
      return Promise.resolve({
        data: {
          tokens,
          nfts,
          totalValue,
          assets: [...tokens, ...nfts]
        }
      })
    }
  }
}

// 创建axios实例
const instance = axios.create({
  baseURL: process.env.NODE_ENV === 'development' 
    ? '/api' 
    : 'https://api.web3social.example.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
instance.interceptors.request.use(
  config => {
    // 从本地获取token
    const token = uni.getStorageSync('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 针对不同平台进行适配
    if (process.env.UNI_PLATFORM === 'h5') {
      // H5平台特殊处理
    } else if (process.env.UNI_PLATFORM === 'mp-weixin') {
      // 微信小程序特殊处理
    }
    
    return config
  },
  error => {
    console.error('请求错误：', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  response => {
    const res = response.data
    
    // 请求成功
    if (res.code === 0 || res.code === 200) {
      return res.data
    }
    
    // 处理特定错误码
    if (res.code === 401) {
      // 未授权，清除token
      uni.removeStorageSync('token')
      uni.removeStorageSync('walletInfo')
      
      // 跳转到登录页
      uni.showToast({
        title: '登录状态已过期，请重新登录',
        icon: 'none',
        duration: 2000
      })
      
      setTimeout(() => {
        uni.navigateTo({
          url: '/pages/wallet/connect'
        })
      }, 1500)
      
      return Promise.reject(new Error(res.message || '未授权'))
    }
    
    // 其他错误
    uni.showToast({
      title: res.message || '请求失败',
      icon: 'none'
    })
    
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  error => {
    console.error('响应错误：', error)
    
    // 网络错误、超时等
    const message = error.message.includes('timeout')
      ? '请求超时！'
      : '网络异常，请检查网络连接'
    
    uni.showToast({
      title: message,
      icon: 'none'
    })
    
    return Promise.reject(error)
  }
)

// 封装请求方法
export default {
  // GET请求
  get(url, params = {}) {
    return instance.get(url, { params })
  },
  
  // POST请求
  post(url, data = {}) {
    return instance.post(url, data)
  },
  
  // PUT请求
  put(url, data = {}) {
    return instance.put(url, data)
  },
  
  // DELETE请求
  delete(url, params = {}) {
    return instance.delete(url, { params })
  },
  
  // 上传文件
  upload(url, file, onProgress) {
    return new Promise((resolve, reject) => {
      // 使用uni.uploadFile上传
      const uploadTask = uni.uploadFile({
        url: instance.defaults.baseURL + url,
        filePath: file,
        name: 'file',
        header: {
          Authorization: `Bearer ${uni.getStorageSync('token') || ''}`
        },
        success: res => {
          if (res.statusCode === 200) {
            try {
              const data = JSON.parse(res.data)
              if (data.code === 0 || data.code === 200) {
                resolve(data.data)
              } else {
                reject(new Error(data.message || '上传失败'))
              }
            } catch (e) {
              reject(new Error('解析响应数据失败'))
            }
          } else {
            reject(new Error(`上传失败，状态码：${res.statusCode}`))
          }
        },
        fail: err => {
          reject(err)
        }
      })
      
      // 监听上传进度
      if (onProgress) {
        uploadTask.onProgressUpdate(res => {
          onProgress(res.progress)
        })
      }
    })
  }
} 