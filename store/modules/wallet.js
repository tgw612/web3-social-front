import { 
  connectEthereumWallet, 
  isWalletConnected,
  disconnectWallet,
  CHAIN_TYPES,
  WALLET_TYPES
} from '@/utils/web3'

// 预加载OKX WaaS服务
import okxWaaSService from '@/utils/okx-waas'

// 初始状态
const state = {
  // 钱包是否已连接
  isConnected: false,
  
  // 钱包类型（MetaMask, Phantom等）
  walletType: '',
  
  // 链类型（以太坊、Solana等）
  chainType: '',
  
  // 钱包地址
  address: '',
  
  // 原始余额（ETH、SOL等）
  balance: '0',
  
  // 链ID（以太坊网络）
  chainId: null,
  
  // 连接中状态
  connecting: false,
  
  // 错误信息
  error: null,
  
  // OKX资产信息
  okxAssets: {
    // 总估值（美元）
    totalEquity: '0',
    // 资产明细
    assetDetails: []
  }
}

// getter
const getters = {
  isETH: state => state.chainType === CHAIN_TYPES.ETH,
  shortAddress: state => {
    if (!state.address) return ''
    return `${state.address.slice(0, 6)}...${state.address.slice(-4)}`
  }
}

// 突变
const mutations = {
  // 设置钱包连接状态
  SET_CONNECTED(state, isConnected) {
    state.isConnected = isConnected
  },
  
  // 设置钱包信息
  SET_WALLET_INFO(state, { walletType, chainType, address, balance, chainId, okxAssets }) {
    state.walletType = walletType
    state.chainType = chainType
    state.address = address
    state.balance = balance
    state.chainId = chainId
    
    // 如果有OKX资产信息，则更新
    if (okxAssets) {
      state.okxAssets = okxAssets
    }
  },
  
  // 清除钱包信息
  CLEAR_WALLET_INFO(state) {
    state.isConnected = false
    state.walletType = ''
    state.chainType = ''
    state.address = ''
    state.balance = '0'
    state.chainId = null
    state.okxAssets = {
      totalEquity: '0',
      assetDetails: []
    }
  },
  
  // 设置连接中状态
  SET_CONNECTING(state, status) {
    state.connecting = status
  },
  
  // 设置错误信息
  SET_ERROR(state, error) {
    state.error = error
  },
  
  // 更新余额
  UPDATE_BALANCE(state, balance) {
    state.balance = balance
  },
  
  // 更新OKX资产信息
  UPDATE_OKX_ASSETS(state, okxAssets) {
    state.okxAssets = okxAssets
  }
}

// 动作
const actions = {
  // 连接以太坊钱包
  async connectEthWallet({ commit, dispatch }, walletType = WALLET_TYPES.METAMASK) {
    try {
      commit('SET_CONNECTING', true)
      commit('SET_ERROR', null)
      
      // 连接钱包
      const walletInfo = await connectEthereumWallet(walletType)
      
      // 检查是否需要二维码扫码登录
      if (walletInfo && walletInfo.needQRCode) {
        commit('SET_CONNECTING', false)
        return walletInfo
      }
      
      // 保存钱包信息
      commit('SET_WALLET_INFO', walletInfo)
      commit('SET_CONNECTED', true)
      
      // 存储到本地
      uni.setStorageSync('walletInfo', JSON.stringify(walletInfo))
      
      // 如果是OKX钱包，尝试获取资产信息
      if (walletType === WALLET_TYPES.OKX) {
        if (walletInfo.okxAssets) {
          commit('UPDATE_OKX_ASSETS', walletInfo.okxAssets)
        } else {
          // 尝试获取OKX资产信息
          try {
            await dispatch('fetchOKXAssets')
          } catch (assetError) {
            console.warn('获取OKX资产信息失败，但不影响钱包连接:', assetError)
          }
        }
      }
      
      return walletInfo
    } catch (error) {
      console.error('连接以太坊钱包失败：', error)
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_CONNECTING', false)
    }
  },
  
  // 连接Solana钱包
  async connectSolWallet({ commit }, walletType = WALLET_TYPES.PHANTOM) {
    try {
      commit('SET_CONNECTING', true)
      commit('SET_ERROR', null)
      
      // 连接钱包
      const walletInfo = await connectSolanaWallet(walletType)
      
      // 保存钱包信息
      commit('SET_WALLET_INFO', walletInfo)
      commit('SET_CONNECTED', true)
      
      // 存储到本地
      uni.setStorageSync('walletInfo', JSON.stringify(walletInfo))
      
      return walletInfo
    } catch (error) {
      console.error('连接Solana钱包失败：', error)
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_CONNECTING', false)
    }
  },
  
  // 检查钱包连接状态
  async checkConnection({ commit, state }) {
    if (!state.address || !state.chainType) return false
    
    try {
      const connected = await isWalletConnected(state.chainType, state.address)
      
      if (!connected) {
        // 如果钱包未连接，清除状态
        commit('CLEAR_WALLET_INFO')
        uni.removeStorageSync('walletInfo')
      }
      
      return connected
    } catch (error) {
      console.error('检查钱包连接状态失败：', error)
      return false
    }
  },
  
  // 断开钱包连接
  async disconnect({ commit, state }) {
    try {
      if (state.chainType) {
        await disconnectWallet(state.chainType)
      }
      
      // 清除状态
      commit('CLEAR_WALLET_INFO')
      uni.removeStorageSync('walletInfo')
      
      return true
    } catch (error) {
      console.error('断开钱包连接失败：', error)
      throw error
    }
  },
  
  // 恢复连接
  async restoreConnection({ commit, dispatch }, walletInfo) {
    try {
      // 验证钱包是否仍然连接
      const connected = await isWalletConnected(walletInfo.chainType, walletInfo.address)
      
      if (connected) {
        commit('SET_WALLET_INFO', walletInfo)
        commit('SET_CONNECTED', true)
        
        // 如果是OKX钱包，尝试刷新资产信息
        if (walletInfo.walletType === WALLET_TYPES.OKX) {
          try {
            await dispatch('fetchOKXAssets')
          } catch (error) {
            console.warn('刷新OKX资产信息失败:', error)
          }
        }
        
        return true
      } else {
        // 未连接则清除状态
        uni.removeStorageSync('walletInfo')
        return false
      }
    } catch (error) {
      console.error('恢复钱包连接失败：', error)
      return false
    }
  },
  
  // 获取OKX资产信息
  async fetchOKXAssets({ commit, state }) {
    try {
      // 导入OKX WaaS服务
      const okxWaaSService = await import('@/utils/okx-waas').then(module => module.default)
      
      // 检查是否是OKX钱包
      if (state.walletType !== WALLET_TYPES.OKX) {
        throw new Error('当前连接的不是OKX钱包')
      }
      
      // 检查钱包是否已连接
      if (!state.isConnected || !state.address) {
        throw new Error('钱包未连接')
      }
      
      // 设置API配置（实际应用中应从环境变量或配置文件获取）
      // 注意：这里仅为示例，实际应用中应该从安全的地方获取这些值
      okxWaaSService.setApiConfig({
        apiKey: process.env.VUE_APP_OKX_API_KEY || '',
        secretKey: process.env.VUE_APP_OKX_SECRET_KEY || '',
        passphrase: process.env.VUE_APP_OKX_PASSPHRASE || ''
      })
      
      // 获取账户总估值
      const accountBalance = await okxWaaSService.getAccountBalance()
      
      // 获取资产明细
      const assetDetails = await okxWaaSService.getAssetDetails()
      
      // 更新OKX资产信息
      const okxAssets = {
        totalEquity: accountBalance.totalEquity,
        assetDetails: assetDetails
      }
      
      commit('UPDATE_OKX_ASSETS', okxAssets)
      
      return okxAssets
    } catch (error) {
      console.error('获取OKX资产信息失败:', error)
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