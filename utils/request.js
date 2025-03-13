import axios from 'axios'
import Vue from 'vue'

// 创建axios实例
const instance = axios.create({
  baseURL: process.env.VUE_APP_BASE_API || 'https://api.example.com', // 在生产环境中应该设置真实的API地址
  timeout: 15000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
instance.interceptors.request.use(
  config => {
    // 在发送请求前做一些处理
    
    // 获取本地存储的钱包信息
    const walletInfo = uni.getStorageSync('walletInfo')
    
    // 如果有钱包信息，则添加到请求头
    if (walletInfo) {
      const wallet = JSON.parse(walletInfo)
      config.headers['X-Wallet-Address'] = wallet.address
      
      // 如果有token，也可以添加
      if (wallet.token) {
        config.headers['Authorization'] = `Bearer ${wallet.token}`
      }
    }
    
    // 显示加载提示
    uni.showLoading({
      title: '加载中...',
      mask: true
    })
    
    return config
  },
  error => {
    // 关闭加载提示
    uni.hideLoading()
    
    // 显示错误信息
    uni.showToast({
      title: '请求错误',
      icon: 'none'
    })
    
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  response => {
    // 关闭加载提示
    uni.hideLoading()
    
    // HTTP状态码为200，但业务状态可能有错误
    const res = response.data
    
    // 如果业务状态码不为0，则表示有错误
    if (res.code && res.code !== 0) {
      uni.showToast({
        title: res.message || '操作失败',
        icon: 'none'
      })
      
      // 如果是未登录状态，跳转到登录页
      if (res.code === 401) {
        uni.removeStorageSync('walletInfo')
        
        // 使用store
        if (Vue.prototype.$store) {
          Vue.prototype.$store.commit('user/CLEAR_WALLET_INFO')
        }
        
        setTimeout(() => {
          uni.navigateTo({
            url: '/pages/login/login'
          })
        }, 1500)
      }
      
      return Promise.reject(new Error(res.message || '操作失败'))
    }
    
    return res
  },
  error => {
    // 关闭加载提示
    uni.hideLoading()
    
    // 显示错误信息
    let message = '请求失败'
    
    if (error.response) {
      const { status } = error.response
      
      // 根据HTTP状态码显示不同的错误信息
      switch (status) {
        case 400:
          message = '请求错误'
          break
        case 401:
          message = '未授权，请重新登录'
          // 清除本地存储的钱包信息
          uni.removeStorageSync('walletInfo')
          
          // 使用store
          if (Vue.prototype.$store) {
            Vue.prototype.$store.commit('user/CLEAR_WALLET_INFO')
          }
          
          // 跳转到登录页
          setTimeout(() => {
            uni.navigateTo({
              url: '/pages/login/login'
            })
          }, 1500)
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = `请求失败(${status})`
      }
    } else if (error.message.includes('timeout')) {
      message = '请求超时'
    } else {
      message = '网络异常'
    }
    
    uni.showToast({
      title: message,
      icon: 'none'
    })
    
    return Promise.reject(error)
  }
)

// 封装GET请求
const get = (url, params = {}) => {
  return instance({
    url,
    method: 'get',
    params
  })
}

// 封装POST请求
const post = (url, data = {}, config = {}) => {
  return instance({
    url,
    method: 'post',
    data,
    ...config
  })
}

// 封装PUT请求
const put = (url, data = {}) => {
  return instance({
    url,
    method: 'put',
    data
  })
}

// 封装DELETE请求
const del = (url, params = {}) => {
  return instance({
    url,
    method: 'delete',
    params
  })
}

export default {
  get,
  post,
  put,
  delete: del,
  instance
} 