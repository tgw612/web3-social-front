import { 
  connectEthereumWallet, 
  connectSolanaWallet,
  isWalletConnected,
  disconnectWallet,
  CHAIN_TYPES,
  WALLET_TYPES
} from '@/utils/web3'

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
  error: null
}

// getter
const getters = {
  isETH: state => state.chainType === CHAIN_TYPES.ETH,
  isSOL: state => state.chainType === CHAIN_TYPES.SOL,
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
  SET_WALLET_INFO(state, { walletType, chainType, address, balance, chainId }) {
    state.walletType = walletType
    state.chainType = chainType
    state.address = address
    state.balance = balance
    state.chainId = chainId
  },
  
  // 清除钱包信息
  CLEAR_WALLET_INFO(state) {
    state.isConnected = false
    state.walletType = ''
    state.chainType = ''
    state.address = ''
    state.balance = '0'
    state.chainId = null
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
  }
}

// 动作
const actions = {
  // 连接以太坊钱包
  async connectEthWallet({ commit }, walletType = WALLET_TYPES.METAMASK) {
    try {
      commit('SET_CONNECTING', true)
      commit('SET_ERROR', null)
      
      // 连接钱包
      const walletInfo = await connectEthereumWallet(walletType)
      
      // 保存钱包信息
      commit('SET_WALLET_INFO', walletInfo)
      commit('SET_CONNECTED', true)
      
      // 存储到本地
      uni.setStorageSync('walletInfo', JSON.stringify(walletInfo))
      
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
  async restoreConnection({ commit }, walletInfo) {
    try {
      // 验证钱包是否仍然连接
      const connected = await isWalletConnected(walletInfo.chainType, walletInfo.address)
      
      if (connected) {
        commit('SET_WALLET_INFO', walletInfo)
        commit('SET_CONNECTED', true)
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
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} 