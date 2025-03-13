import api from '@/utils/api'

const state = {
  assets: [],
  tokens: [], // 代币资产
  nfts: [], // NFT资产
  totalValue: 0, // 总资产价值（美元）
  loading: false,
  distribution: [], // 资产分布数据 (用于图表)
  assetHistory: [] // 资产历史数据 (用于图表)
}

const mutations = {
  SET_ASSETS(state, assets) {
    state.assets = assets
  },
  SET_TOKENS(state, tokens) {
    state.tokens = tokens
  },
  SET_NFTS(state, nfts) {
    state.nfts = nfts
  },
  SET_TOTAL_VALUE(state, value) {
    state.totalValue = value
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_DISTRIBUTION(state, distribution) {
    state.distribution = distribution
  },
  SET_ASSET_HISTORY(state, history) {
    state.assetHistory = history
  }
}

const actions = {
  // 获取用户资产
  async fetchAssets({ commit, rootState }) {
    try {
      if (!rootState.user.isLoggedIn) return
      
      commit('SET_LOADING', true)
      
      const address = rootState.user.walletInfo.address
      const networkType = rootState.networkType // 'ethereum' or 'solana'
      
      // 获取资产数据
      const { data } = await api.getUserAssets({ address, networkType })
      
      if (data) {
        commit('SET_ASSETS', data.assets || [])
        commit('SET_TOKENS', data.tokens || [])
        commit('SET_NFTS', data.nfts || [])
        commit('SET_TOTAL_VALUE', data.totalValue || 0)
        
        // 处理资产分布数据
        if (data.tokens && data.tokens.length > 0) {
          const distribution = data.tokens.map(token => ({
            name: token.symbol,
            value: token.value,
            percentage: (token.value / data.totalValue) * 100
          }))
          commit('SET_DISTRIBUTION', distribution)
        }
      }
    } catch (error) {
      console.error('获取用户资产失败', error)
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  // 获取资产历史数据 (用于图表)
  async fetchAssetHistory({ commit, rootState }, { timeRange = '1m' } = {}) {
    try {
      if (!rootState.user.isLoggedIn) return
      
      commit('SET_LOADING', true)
      
      const address = rootState.user.walletInfo.address
      const networkType = rootState.networkType
      
      const { data } = await api.getAssetHistory({ address, networkType, timeRange })
      
      if (data && data.history) {
        commit('SET_ASSET_HISTORY', data.history)
      }
    } catch (error) {
      console.error('获取资产历史数据失败', error)
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  // 获取其他用户的资产数据
  async fetchUserAssets({ commit }, { address, networkType = 'ethereum' }) {
    try {
      commit('SET_LOADING', true)
      
      const { data } = await api.getUserAssets({ address, networkType })
      
      if (data) {
        return {
          success: true,
          assets: data.assets || [],
          tokens: data.tokens || [],
          nfts: data.nfts || [],
          totalValue: data.totalValue || 0
        }
      }
      
      return { success: false }
    } catch (error) {
      console.error('获取用户资产失败', error)
      return { success: false, error }
    } finally {
      commit('SET_LOADING', false)
    }
  }
}

const getters = {
  allAssets: state => state.assets,
  tokenAssets: state => state.tokens,
  nftAssets: state => state.nfts,
  totalAssetValue: state => state.totalValue,
  isLoading: state => state.loading,
  assetDistribution: state => state.distribution,
  assetHistoryData: state => state.assetHistory,
  formattedTotalValue: state => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(state.totalValue)
  },
  // 返回前5个最有价值的代币
  topTokens: state => {
    return [...state.tokens]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
} 