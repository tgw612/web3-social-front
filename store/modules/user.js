import api from '@/utils/api'
import { signMessage } from '@/utils/web3'
import { uploadFileToIpfs, getIpfsUrl } from '@/utils/ipfs'

// 初始状态
const state = {
  // 用户是否已登录
  isLoggedIn: false,
  
  // 用户令牌
  token: '',
  
  // 用户基本信息
  userInfo: {
    userId: '',
    username: '',
    nickname: '',
    avatar: '',
    address: '',
    bio: '',
    totalAssets: '0',
    followerCount: 0,
    followingCount: 0,
    postCount: 0
  },
  
  // 是否获取用户信息中
  loading: false,
  
  // 错误信息
  error: null
}

// getter
const getters = {
  hasUserInfo: state => !!state.userInfo.userId,
  avatarUrl: state => {
    if (!state.userInfo.avatar) return '/static/images/default-avatar.png'
    if (state.userInfo.avatar.startsWith('http')) return state.userInfo.avatar
    return getIpfsUrl(state.userInfo.avatar)
  }
}

// 突变
const mutations = {
  // 设置登录状态
  SET_LOGGED_IN(state, status) {
    state.isLoggedIn = status
  },
  
  // 设置令牌
  SET_TOKEN(state, token) {
    state.token = token
  },
  
  // 设置用户信息
  SET_USER_INFO(state, userInfo) {
    state.userInfo = { ...state.userInfo, ...userInfo }
  },
  
  // 设置加载状态
  SET_LOADING(state, status) {
    state.loading = status
  },
  
  // 设置错误信息
  SET_ERROR(state, error) {
    state.error = error
  },
  
  // 清除用户信息
  CLEAR_USER_INFO(state) {
    state.isLoggedIn = false
    state.token = ''
    state.userInfo = {
      userId: '',
      username: '',
      nickname: '',
      avatar: '',
      address: '',
      bio: '',
      totalAssets: '0',
      followerCount: 0,
      followingCount: 0,
      postCount: 0
    }
  }
}

// 动作
const actions = {
  // 通过钱包登录
  async loginWithWallet({ commit, rootState }) {
    try {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      const { address, chainType } = rootState.wallet
      
      if (!address || !chainType) {
        throw new Error('请先连接钱包')
      }
      
      // 生成随机消息用于签名
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const message = `登录Web3Social平台 ${timestamp} ${randomString}`
      
      // 使用钱包签名
      const signature = await signMessage(message, chainType, address)
      
      // 发送登录请求
      const response = await api.post('/auth/login', {
        address,
        chainType,
        message,
        signature,
        timestamp
      })
      
      // 保存令牌和用户信息
      commit('SET_TOKEN', response.token)
      commit('SET_USER_INFO', response.userInfo)
      commit('SET_LOGGED_IN', true)
      
      // 存储到本地
      uni.setStorageSync('token', response.token)
      
      return response
    } catch (error) {
      console.error('钱包登录失败：', error)
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  // 获取用户信息
  async getUserInfo({ commit, state }) {
    // 已有用户信息且不是加载中，直接返回
    if (state.userInfo.userId && !state.loading) {
      return state.userInfo
    }
    
    try {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      // 获取用户信息
      const userInfo = await api.get('/user/info')
      
      // 更新状态
      commit('SET_USER_INFO', userInfo)
      
      return userInfo
    } catch (error) {
      console.error('获取用户信息失败：', error)
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  // 更新用户资料
  async updateUserProfile({ commit }, profileData) {
    try {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      // 如果有头像文件需要上传到IPFS
      if (profileData.avatarFile) {
        const avatarCid = await uploadFileToIpfs(profileData.avatarFile)
        profileData.avatar = avatarCid
        delete profileData.avatarFile
      }
      
      // 更新用户资料
      const updatedProfile = await api.put('/user/profile', profileData)
      
      // 更新状态
      commit('SET_USER_INFO', updatedProfile)
      
      return updatedProfile
    } catch (error) {
      console.error('更新用户资料失败：', error)
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  // 获取指定用户资料
  async getUserProfile({ commit }, userId) {
    try {
      commit('SET_LOADING', true)
      
      // 获取用户资料
      const userProfile = await api.get(`/user/profile/${userId}`)
      
      return userProfile
    } catch (error) {
      console.error('获取用户资料失败：', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  // 登出
  async logout({ commit }) {
    try {
      // 清除本地存储
      uni.removeStorageSync('token')
      
      // 清除状态
      commit('CLEAR_USER_INFO')
      
      return true
    } catch (error) {
      console.error('登出失败：', error)
      throw error
    }
  },
  
  // 检查用户名是否可用
  async checkUsernameAvailable({ commit }, username) {
    try {
      const result = await api.get('/user/check-username', { username })
      return result.available
    } catch (error) {
      console.error('检查用户名失败：', error)
      throw error
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} 