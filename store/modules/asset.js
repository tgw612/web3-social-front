import api from '@/utils/api'

// 初始状态
const state = {
  // 资产列表
  assets: [],
  
  // 总资产价值（USD）
  totalValue: 0,
  
  // NFT列表
  nfts: [],
  
  // 资产分布数据（用于图表展示）
  distribution: [],
  
  // 最近交易记录
  recentTransactions: [],
  
  // 是否加载中
  loading: false,
  
  // 错误信息
  error: null,
  
  // 最后更新时间
  lastUpdated: null
}

// getter
const getters = {
  // 资产数量
  assetCount: state => state.assets.length,
  
  // NFT数量
  nftCount: state => state.nfts.length,
  
  // 格式化总资产
  formattedTotalValue: state => {
    if (!state.totalValue) return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(state.totalValue)
  },
  
  // 按价值排序的资产
  sortedAssetsByValue: state => {
    return [...state.assets].sort((a, b) => b.valueUsd - a.valueUsd)
  },
  
  // 主要资产（价值前5位）
  topAssets: (state, getters) => {
    return getters.sortedAssetsByValue.slice(0, 5)
  }
}

// 突变
const mutations = {
  // 设置资产列表
  SET_ASSETS(state, assets) {
    state.assets = assets
  },
  
  // 设置总资产价值
  SET_TOTAL_VALUE(state, value) {
    state.totalValue = value
  },
  
  // 设置NFT列表
  SET_NFTS(state, nfts) {
    state.nfts = nfts
  },
  
  // 设置资产分布
  SET_DISTRIBUTION(state, distribution) {
    state.distribution = distribution
  },
  
  // 设置最近交易
  SET_RECENT_TRANSACTIONS(state, transactions) {
    state.recentTransactions = transactions
  },
  
  // 设置加载状态
  SET_LOADING(state, status) {
    state.loading = status
  },
  
  // 设置错误信息
  SET_ERROR(state, error) {
    state.error = error
  },
  
  // 设置最后更新时间
  SET_LAST_UPDATED(state, timestamp) {
    state.lastUpdated = timestamp
  },
  
  // 清除资产数据
  CLEAR_ASSETS(state) {
    state.assets = []
    state.totalValue = 0
    state.nfts = []
    state.distribution = []
    state.recentTransactions = []
    state.lastUpdated = null
  }
}

// 动作
const actions = {
  // 获取用户资产
  async fetchUserAssets({ commit, rootState }) {
    try {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      const { address } = rootState.wallet
      
      if (!address) {
        throw new Error('请先连接钱包')
      }
      
      // 获取资产列表
      const assetsData = await api.get('/asset/list', { address })
      
      // 获取NFT列表
      const nftsData = await api.get('/asset/nfts', { address })
      
      // 计算总资产价值
      let totalValue = 0
      if (assetsData && assetsData.length > 0) {
        totalValue = assetsData.reduce((total, asset) => total + (asset.valueUsd || 0), 0)
      }
      
      // 计算资产分布
      const distribution = calculateDistribution(assetsData)
      
      // 获取最近交易
      const transactions = await api.get('/asset/transactions', { 
        address,
        limit: 10 
      })
      
      // 更新状态
      commit('SET_ASSETS', assetsData)
      commit('SET_NFTS', nftsData)
      commit('SET_TOTAL_VALUE', totalValue)
      commit('SET_DISTRIBUTION', distribution)
      commit('SET_RECENT_TRANSACTIONS', transactions)
      commit('SET_LAST_UPDATED', Date.now())
      
      return {
        assets: assetsData,
        nfts: nftsData,
        totalValue
      }
    } catch (error) {
      console.error('获取用户资产失败：', error)
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  // 获取指定用户资产
  async fetchUserAssetsByAddress({ commit }, address) {
    try {
      commit('SET_LOADING', true)
      
      if (!address) {
        throw new Error('地址不能为空')
      }
      
      // 获取资产列表
      const assetsData = await api.get('/asset/list', { address, isPublic: true })
      
      // 计算总资产价值
      let totalValue = 0
      if (assetsData && assetsData.length > 0) {
        totalValue = assetsData.reduce((total, asset) => total + (asset.valueUsd || 0), 0)
      }
      
      // 计算资产分布
      const distribution = calculateDistribution(assetsData)
      
      return {
        assets: assetsData,
        totalValue,
        distribution
      }
    } catch (error) {
      console.error('获取指定用户资产失败：', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  // 刷新资产数据
  async refreshAssets({ dispatch }) {
    return await dispatch('fetchUserAssets')
  },
  
  // 清除资产数据
  clearAssets({ commit }) {
    commit('CLEAR_ASSETS')
  }
}

// 计算资产分布 (私有辅助函数)
const calculateDistribution = (assets) => {
  if (!assets || assets.length === 0) return []
  
  // 按类型分组
  const groups = assets.reduce((acc, asset) => {
    const type = asset.type || '其他'
    if (!acc[type]) {
      acc[type] = 0
    }
    acc[type] += (asset.valueUsd || 0)
    return acc
  }, {})
  
  // 转换为数组格式
  return Object.keys(groups).map(type => ({
    name: type,
    value: groups[type]
  }))
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} 