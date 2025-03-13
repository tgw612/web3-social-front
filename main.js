import Vue from 'vue'
import App from './App'
import store from './store'
import './utils/web3'

// 引入 IPFS 客户端
import { createIpfsClient } from './utils/ipfs'

// 全局组件
import PostCard from './components/post-card/post-card.vue'
import UserInfo from './components/user-info/user-info.vue'
import AssetChart from './components/asset-chart/asset-chart.vue'
import CommentItem from './components/comment-item/comment-item.vue'
import WalletConnector from './components/wallet-connector/wallet-connector.vue'

// 全局过滤器
import * as filters from './utils/format'

// 注册全局组件
Vue.component('post-card', PostCard)
Vue.component('user-info', UserInfo)
Vue.component('asset-chart', AssetChart)
Vue.component('comment-item', CommentItem)
Vue.component('wallet-connector', WalletConnector)

// 注册全局过滤器
Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key])
})

// 全局分享功能配置
Vue.mixin({
  onShareAppMessage() {
    return {
      title: 'Web3匿名社交平台 - 基于区块链的去中心化社交应用',
      path: '/pages/index/index',
      imageUrl: '/static/share-image.png'
    }
  }
})

App.mpType = 'app'

const app = new Vue({
  store,
  ...App
})
app.$mount() 