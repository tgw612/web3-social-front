import Vue from 'vue'
import Vuex from 'vuex'

// 导入各个模块
import user from './modules/user'
import wallet from './modules/wallet'
import asset from './modules/asset'
import post from './modules/post'

Vue.use(Vuex)

// 创建store实例
const store = new Vuex.Store({
  state: {
    // 全局状态
    isLoading: false,
    systemInfo: uni.getSystemInfoSync(),
    networkStatus: true,
  },
  
  mutations: {
    // 设置加载状态
    SET_LOADING(state, status) {
      state.isLoading = status
    },
    
    // 设置网络状态
    SET_NETWORK_STATUS(state, status) {
      state.networkStatus = status
    }
  },
  
  actions: {
    // 初始化应用
    initApp({ dispatch }) {
      console.log('初始化应用...')
      
      // 检查网络状态
      uni.getNetworkType({
        success: (res) => {
          const isConnected = res.networkType !== 'none'
          this.commit('SET_NETWORK_STATUS', isConnected)
        }
      })
      
      // 监听网络状态变化
      uni.onNetworkStatusChange((res) => {
        this.commit('SET_NETWORK_STATUS', res.isConnected)
        
        if (res.isConnected) {
          console.log('网络已恢复')
        } else {
          console.log('网络已断开')
          uni.showToast({
            title: '网络已断开，请检查网络连接',
            icon: 'none'
          })
        }
      })
    }
  },
  
  modules: {
    user,
    wallet,
    asset,
    post
  }
})

export default store 