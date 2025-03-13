<template>
  <view class="assets-container">
    <!-- 头部资产概览 -->
    <view class="assets-header card">
      <view class="header-top">
        <view class="title-area">
          <text class="page-title">我的资产</text>
          <text class="network-type">{{ currentNetwork }}</text>
        </view>
        <view class="actions">
          <view class="action-btn" @tap="switchNetwork">
            <text class="iconfont icon-switch"></text>
          </view>
          <view class="action-btn" @tap="refresh">
            <text class="iconfont icon-refresh"></text>
          </view>
        </view>
      </view>
      
      <view class="total-assets">
        <text class="total-label">总资产（USD）</text>
        <text class="total-value">{{ formattedTotalValue }}</text>
        <view class="value-trend" :class="{ 'trend-up': valueTrend > 0, 'trend-down': valueTrend < 0 }">
          <text class="trend-icon">{{ valueTrend > 0 ? '↑' : '↓' }}</text>
          <text class="trend-value">{{ Math.abs(valueTrend).toFixed(2) }}%</text>
          <text class="trend-period">24h</text>
        </view>
      </view>
    </view>
    
    <!-- 资产分布图表 -->
    <view class="assets-chart card">
      <view class="section-header">
        <text class="section-title">资产分布</text>
        <text class="section-action" @tap="toggleChartType">{{ chartType === 'pie' ? '切换到柱状图' : '切换到饼图' }}</text>
      </view>
      
      <view class="chart-container">
        <canvas canvas-id="distribution-chart" id="distribution-chart" class="chart-canvas"></canvas>
      </view>
      
      <!-- 顶部代币列表 -->
      <view class="top-tokens">
        <view class="token-legend" v-for="(token, index) in topTokens" :key="token.symbol">
          <view class="legend-color" :style="{ backgroundColor: getChartColor(index) }"></view>
          <view class="legend-info">
            <text class="legend-name">{{ token.symbol }}</text>
            <text class="legend-percentage">{{ ((token.value / totalValue) * 100).toFixed(2) }}%</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 资产列表 -->
    <view class="assets-list card">
      <view class="section-header">
        <text class="section-title">资产明细</text>
        <view class="tabs">
          <text 
            class="tab-item" 
            :class="{ active: activeTab === 'token' }"
            @tap="switchTab('token')"
          >
            代币
          </text>
          <text 
            class="tab-item" 
            :class="{ active: activeTab === 'nft' }"
            @tap="switchTab('nft')"
          >
            NFT
          </text>
        </view>
      </view>
      
      <!-- 代币列表 -->
      <view class="token-list" v-if="activeTab === 'token'">
        <view class="token-item" v-for="token in tokenAssets" :key="token.symbol">
          <image class="token-icon" :src="token.icon || '/static/coins/default.png'" mode="aspectFit"></image>
          <view class="token-info">
            <view class="token-name-area">
              <text class="token-symbol">{{ token.symbol }}</text>
              <text class="token-name">{{ token.name }}</text>
            </view>
            <view class="token-price-area">
              <text class="token-balance">{{ token.balance }} {{ token.symbol }}</text>
              <text class="token-value">${{ formatNumber(token.value) }}</text>
            </view>
          </view>
          <view class="token-change" :class="{ 'change-up': token.change24h > 0, 'change-down': token.change24h < 0 }">
            {{ token.change24h > 0 ? '+' : '' }}{{ token.change24h }}%
          </view>
        </view>
        
        <!-- 空状态 -->
        <view class="empty-state" v-if="tokenAssets.length === 0 && !loading">
          <image class="empty-icon" src="/static/empty-asset.png" mode="aspectFit"></image>
          <text class="empty-text">暂无代币资产</text>
        </view>
      </view>
      
      <!-- NFT列表 -->
      <view class="nft-list" v-if="activeTab === 'nft'">
        <view class="nft-grid">
          <view class="nft-item" v-for="nft in nftAssets" :key="nft.id">
            <image class="nft-image" :src="nft.image" mode="aspectFill"></image>
            <view class="nft-info">
              <text class="nft-name">{{ nft.name }}</text>
              <text class="nft-collection">{{ nft.collection }}</text>
              <text class="nft-price">Floor: {{ nft.floorPrice }} ETH</text>
            </view>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view class="empty-state" v-if="nftAssets.length === 0 && !loading">
          <image class="empty-icon" src="/static/empty-nft.png" mode="aspectFit"></image>
          <text class="empty-text">暂无NFT资产</text>
        </view>
      </view>
      
      <!-- 加载状态 -->
      <view class="loading-state" v-if="loading">
        <view class="spinner"></view>
        <text class="loading-text">资产加载中...</text>
      </view>
    </view>
    
    <!-- 历史趋势 -->
    <view class="assets-history card">
      <view class="section-header">
        <text class="section-title">资产趋势</text>
        <view class="time-range">
          <text 
            class="range-item" 
            v-for="range in timeRanges" 
            :key="range.value"
            :class="{ active: currentRange === range.value }"
            @tap="changeTimeRange(range.value)"
          >
            {{ range.label }}
          </text>
        </view>
      </view>
      
      <view class="chart-container">
        <canvas canvas-id="history-chart" id="history-chart" class="chart-canvas"></canvas>
      </view>
    </view>
  </view>
</template>

<script>
import uCharts from '@/utils/u-charts.min.js'
import { mapState, mapGetters, mapActions } from 'vuex'

let distributionChart = null
let historyChart = null

export default {
  data() {
    return {
      chartType: 'pie', // 'pie' or 'column'
      activeTab: 'token', // 'token' or 'nft'
      currentRange: '1m', // '1d', '1w', '1m', '3m', 'all'
      timeRanges: [
        { label: '1天', value: '1d' },
        { label: '1周', value: '1w' },
        { label: '1月', value: '1m' },
        { label: '3月', value: '3m' },
        { label: '全部', value: 'all' }
      ],
      valueTrend: 2.45, // 模拟数据，实际应从API获取
      currentNetwork: 'Ethereum' // 'Ethereum' or 'Solana'
    }
  },
  computed: {
    ...mapState({
      loading: state => state.assets.loading,
      distribution: state => state.assets.distribution,
      assetHistory: state => state.assets.assetHistory
    }),
    ...mapGetters({
      tokenAssets: 'assets/tokenAssets',
      nftAssets: 'assets/nftAssets',
      totalValue: 'assets/totalAssetValue',
      formattedTotalValue: 'assets/formattedTotalValue',
      topTokens: 'assets/topTokens'
    })
  },
  onLoad() {
    // 获取资产数据
    this.fetchAssets()
    
    // 获取资产历史数据
    this.fetchAssetHistory({ timeRange: this.currentRange })
  },
  mounted() {
    // 初始化图表
    this.$nextTick(() => {
      setTimeout(() => {
        this.initDistributionChart()
        this.initHistoryChart()
      }, 500)
    })
  },
  methods: {
    ...mapActions('assets', ['fetchAssets', 'fetchAssetHistory']),
    
    // 刷新资产数据
    async refresh() {
      uni.showLoading({
        title: '更新资产中...'
      })
      
      await this.fetchAssets()
      await this.fetchAssetHistory({ timeRange: this.currentRange })
      
      this.updateCharts()
      
      uni.hideLoading()
      uni.showToast({
        title: '资产已更新',
        icon: 'success'
      })
    },
    
    // 切换网络
    switchNetwork() {
      const networks = ['Ethereum', 'Solana']
      const index = networks.indexOf(this.currentNetwork)
      const nextIndex = (index + 1) % networks.length
      
      this.currentNetwork = networks[nextIndex]
      this.$store.dispatch('switchNetwork', this.currentNetwork.toLowerCase())
      
      // 重新获取资产
      this.refresh()
    },
    
    // 切换标签
    switchTab(tab) {
      this.activeTab = tab
    },
    
    // 切换图表类型
    toggleChartType() {
      this.chartType = this.chartType === 'pie' ? 'column' : 'pie'
      this.initDistributionChart()
    },
    
    // 更改时间范围
    async changeTimeRange(range) {
      if (this.currentRange === range) return
      
      this.currentRange = range
      
      await this.fetchAssetHistory({ timeRange: range })
      this.initHistoryChart()
    },
    
    // 初始化资产分布图表
    initDistributionChart() {
      if (!this.topTokens || this.topTokens.length === 0) return
      
      const ctx = uni.createCanvasContext('distribution-chart', this)
      const canvasId = 'distribution-chart'
      
      const series = this.topTokens.map(token => ({
        name: token.symbol,
        data: token.value
      }))
      
      if (this.chartType === 'pie') {
        // 饼图配置
        distributionChart = new uCharts({
          canvasId,
          type: 'pie',
          context: ctx,
          width: 300,
          height: 220,
          series: series,
          animation: true,
          background: '#FFFFFF',
          padding: [15, 15, 0, 15],
          legend: { show: false },
          extra: {
            pie: {
              activeRadius: 10,
              offsetAngle: 0,
              labelWidth: 15,
              border: false,
              borderWidth: 2,
              borderColor: '#FFFFFF'
            }
          }
        })
      } else {
        // 柱状图配置
        distributionChart = new uCharts({
          canvasId,
          type: 'column',
          context: ctx,
          categories: series.map(item => item.name),
          series: [{
            name: '资产值',
            data: series.map(item => item.data)
          }],
          width: 300,
          height: 220,
          background: '#FFFFFF',
          padding: [15, 15, 15, 15],
          color: ['#1890FF', '#91CB74', '#FAC858', '#EE6666', '#73C0DE'],
          enableScroll: false,
          legend: { show: false },
          xAxis: {
            disableGrid: true,
            itemCount: 5
          },
          yAxis: {
            data: [{
              min: 0
            }],
            showTitle: false
          },
          extra: {
            column: {
              width: 20,
              radius: 5
            }
          }
        })
      }
      
      // 绘制图表
      distributionChart.drawCharts()
    },
    
    // 初始化资产历史图表
    initHistoryChart() {
      if (!this.assetHistory || this.assetHistory.length === 0) {
        // 模拟历史数据
        const mockHistory = this.generateMockHistory()
        this.drawHistoryChart(mockHistory)
        return
      }
      
      this.drawHistoryChart(this.assetHistory)
    },
    
    // 绘制历史图表
    drawHistoryChart(historyData) {
      const ctx = uni.createCanvasContext('history-chart', this)
      const canvasId = 'history-chart'
      
      historyChart = new uCharts({
        canvasId,
        type: 'line',
        context: ctx,
        categories: historyData.map(item => item.date),
        series: [{
          name: '资产值',
          data: historyData.map(item => item.value),
          color: '#1890FF',
          lineType: 'solid'
        }],
        width: 300,
        height: 200,
        background: '#FFFFFF',
        padding: [15, 15, 15, 15],
        enableScroll: false,
        legend: { show: false },
        xAxis: {
          disableGrid: true,
          itemCount: 5
        },
        yAxis: {
          gridType: 'dash',
          dashLength: 4,
          data: [{
            min: 0
          }],
          showTitle: false
        },
        extra: {
          line: {
            type: 'curve', // 曲线类型
            width: 2,
            activeType: 'hollow',
            linearType: 'custom',
            onShadow: true,
            addPoint: true
          }
        }
      })
      
      historyChart.drawCharts()
    },
    
    // 更新图表
    updateCharts() {
      if (distributionChart) {
        this.initDistributionChart()
      }
      
      if (historyChart) {
        this.initHistoryChart()
      }
    },
    
    // 获取图表颜色
    getChartColor(index) {
      const colors = ['#1890FF', '#91CB74', '#FAC858', '#EE6666', '#73C0DE']
      return colors[index % colors.length]
    },
    
    // 格式化数字
    formatNumber(num) {
      if (num === undefined || num === null) return '0'
      
      if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M'
      } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K'
      } else {
        return num.toFixed(2)
      }
    },
    
    // 生成模拟历史数据
    generateMockHistory() {
      const ranges = {
        '1d': 24,
        '1w': 7,
        '1m': 30,
        '3m': 90,
        'all': 180
      }
      
      const count = ranges[this.currentRange] || 30
      const now = new Date()
      const result = []
      
      // 基础值
      let baseValue = this.totalValue * 0.8
      
      for (let i = 0; i < count; i++) {
        const date = new Date(now)
        
        if (this.currentRange === '1d') {
          // 每小时
          date.setHours(date.getHours() - (count - i - 1))
          
          // 格式化为小时
          const formattedDate = `${date.getHours()}:00`
          
          // 波动范围较小
          const randomChange = (Math.random() - 0.4) * 0.02
          baseValue = baseValue * (1 + randomChange)
          
          result.push({
            date: formattedDate,
            value: baseValue
          })
        } else {
          // 每天
          date.setDate(date.getDate() - (count - i - 1))
          
          // 格式化为日期
          const month = date.getMonth() + 1
          const day = date.getDate()
          const formattedDate = `${month}/${day}`
          
          // 波动范围稍大
          const randomChange = (Math.random() - 0.4) * 0.05
          baseValue = baseValue * (1 + randomChange)
          
          result.push({
            date: formattedDate,
            value: baseValue
          })
        }
      }
      
      return result
    }
  },
  // 处理屏幕旋转等布局改变
  onResize() {
    if (distributionChart) {
      distributionChart.resizeCanvas()
    }
    if (historyChart) {
      historyChart.resizeCanvas()
    }
  }
}
</script>

<style>
.assets-container {
  background-color: #f8f8f8;
  min-height: 100vh;
  padding-bottom: 30rpx;
}

.card {
  background-color: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  margin: 20rpx;
  padding: 30rpx;
}

/* 头部资产概览 */
.assets-header {
  background: linear-gradient(135deg, #1890ff, #722ed1);
  color: #fff;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.title-area {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 32rpx;
  font-weight: 500;
  margin-right: 16rpx;
}

.network-type {
  font-size: 24rpx;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}

.actions {
  display: flex;
}

.action-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 16rpx;
}

.iconfont {
  font-size: 36rpx;
}

.total-assets {
  padding: 20rpx 0;
}

.total-label {
  font-size: 24rpx;
  opacity: 0.8;
  margin-bottom: 10rpx;
}

.total-value {
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.value-trend {
  display: inline-flex;
  align-items: center;
  font-size: 24rpx;
  padding: 6rpx 12rpx;
  border-radius: 20rpx;
  background-color: rgba(255, 255, 255, 0.1);
}

.trend-up {
  background-color: rgba(82, 196, 26, 0.2);
}

.trend-down {
  background-color: rgba(255, 77, 79, 0.2);
}

.trend-icon {
  margin-right: 4rpx;
}

.trend-period {
  margin-left: 8rpx;
  opacity: 0.8;
}

/* 资产分布图表 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
}

.section-action {
  font-size: 24rpx;
  color: #1890ff;
}

.chart-container {
  height: 400rpx;
  display: flex;
  justify-content: center;
  padding: 20rpx 0;
}

.chart-canvas {
  width: 100%;
  height: 100%;
}

.top-tokens {
  display: flex;
  flex-wrap: wrap;
  margin-top: 20rpx;
}

.token-legend {
  display: flex;
  align-items: center;
  width: 50%;
  margin-bottom: 16rpx;
}

.legend-color {
  width: 20rpx;
  height: 20rpx;
  border-radius: 4rpx;
  margin-right: 8rpx;
}

.legend-info {
  display: flex;
  flex-direction: column;
}

.legend-name {
  font-size: 24rpx;
  color: #333;
}

.legend-percentage {
  font-size: 22rpx;
  color: #999;
}

/* 资产列表 */
.tabs {
  display: flex;
}

.tab-item {
  font-size: 28rpx;
  color: #666;
  margin-left: 30rpx;
  position: relative;
}

.tab-item.active {
  color: #1890ff;
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -8rpx;
  height: 3rpx;
  background-color: #1890ff;
  border-radius: 2rpx;
}

.token-list {
  margin-top: 20rpx;
}

.token-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.token-icon {
  width: 80rpx;
  height: 80rpx;
  margin-right: 20rpx;
  border-radius: 50%;
  background-color: #f5f5f5;
}

.token-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
}

.token-name-area {
  display: flex;
  flex-direction: column;
}

.token-symbol {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 6rpx;
}

.token-name {
  font-size: 24rpx;
  color: #999;
}

.token-price-area {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.token-balance {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 6rpx;
}

.token-value {
  font-size: 24rpx;
  color: #999;
}

.token-change {
  width: 120rpx;
  text-align: right;
  font-size: 26rpx;
}

.change-up {
  color: #52c41a;
}

.change-down {
  color: #ff4d4f;
}

/* NFT列表 */
.nft-grid {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -10rpx;
}

.nft-item {
  width: calc(50% - 20rpx);
  margin: 10rpx;
  background-color: #f8f8f8;
  border-radius: 12rpx;
  overflow: hidden;
}

.nft-image {
  width: 100%;
  height: 300rpx;
  background-color: #f0f0f0;
}

.nft-info {
  padding: 16rpx;
}

.nft-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 6rpx;
}

.nft-collection {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 6rpx;
}

.nft-price {
  font-size: 24rpx;
  color: #1890ff;
}

/* 空状态 */
.empty-state {
  padding: 80rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* 加载状态 */
.loading-state {
  padding: 40rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 时间范围选择 */
.time-range {
  display: flex;
}

.range-item {
  font-size: 24rpx;
  color: #666;
  padding: 6rpx 16rpx;
  margin-left: 10rpx;
  border-radius: 20rpx;
}

.range-item.active {
  background-color: rgba(24, 144, 255, 0.1);
  color: #1890ff;
}

/* 图标字体 */
@font-face {
  font-family: 'iconfont';
  src: url('data:font/woff2;charset=utf-8;base64,...') format('woff2');
}

.iconfont {
  font-family: "iconfont" !important;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.icon-switch:before {
  content: "\e634";
}

.icon-refresh:before {
  content: "\e650";
}
</style> 