<template>
  <view class="asset-chart">
    <view class="chart-header" v-if="title">
      <text class="chart-title">{{ title }}</text>
      <slot name="header-right"></slot>
    </view>
    
    <view class="chart-container" :style="{ height: height + 'px' }">
      <canvas 
        canvas-id="asset-chart" 
        id="asset-chart"
        class="chart-canvas" 
        :style="{ height: height + 'px', width: '100%' }"
        @error="onCanvasError"
      ></canvas>
      
      <!-- 无数据显示 -->
      <view class="no-data" v-if="!chartData || chartData.length === 0">
        <uni-icons type="folder-open" size="40" color="#ddd"></uni-icons>
        <text class="no-data-text">暂无资产数据</text>
      </view>
      
      <!-- 加载中 -->
      <view class="loading" v-if="loading">
        <uni-load-more status="loading" :contentText="{ contentrefresh: '加载中...' }"></uni-load-more>
      </view>
    </view>
    
    <!-- 图表类型下方的图例 -->
    <view class="chart-legend" v-if="showLegend && chartData && chartData.length > 0">
      <view 
        class="legend-item" 
        v-for="(item, index) in chartData" 
        :key="index"
      >
        <view class="legend-color" :style="{ backgroundColor: getColor(index) }"></view>
        <text class="legend-name">{{ item.name }}</text>
        <text class="legend-value">{{ formatValue(item.value) }}</text>
        <text class="legend-percent">{{ calculatePercent(item.value) }}</text>
      </view>
    </view>
  </view>
</template>

<script>
// 引入图表
import uCharts from '../../../uni_modules/ucharts/u-charts/u-charts.js'

export default {
  name: 'asset-chart',
  
  props: {
    // 图表标题
    title: {
      type: String,
      default: ''
    },
    
    // 图表数据
    chartData: {
      type: Array,
      default: () => []
    },
    
    // 图表类型：pie-饼图，ring-环形图，column-柱状图
    type: {
      type: String,
      default: 'pie',
      validator: (value) => ['pie', 'ring', 'column'].includes(value)
    },
    
    // 图表高度
    height: {
      type: Number,
      default: 200
    },
    
    // 是否显示图例
    showLegend: {
      type: Boolean,
      default: true
    },
    
    // 是否加载中
    loading: {
      type: Boolean,
      default: false
    },
    
    // 颜色配置
    colors: {
      type: Array,
      default: () => ['#3cc51f', '#1890ff', '#ffc107', '#9c27b0', '#ff5722', '#607d8b']
    }
  },
  
  data() {
    return {
      chart: null,
      canvasId: 'asset-chart'
    }
  },
  
  watch: {
    // 监听数据变化，更新图表
    chartData: {
      handler(newData) {
        if (newData && newData.length > 0) {
          this.$nextTick(() => {
            this.renderChart()
          })
        }
      },
      deep: true
    },
    
    // 监听图表类型变化
    type() {
      this.$nextTick(() => {
        this.renderChart()
      })
    }
  },
  
  mounted() {
    if (this.chartData && this.chartData.length > 0) {
      this.$nextTick(() => {
        this.renderChart()
      })
    }
  },
  
  methods: {
    // 渲染图表
    renderChart() {
      try {
        const ctx = uni.createCanvasContext(this.canvasId, this)
        
        // 设置画布宽度
        const query = uni.createSelectorQuery().in(this)
        query.select('#' + this.canvasId).boundingClientRect(data => {
          if (data) {
            const chartData = this.formatChartData()
            
            // 图表配置
            const options = {
              ...this.getChartOptions(),
              width: data.width,
              height: this.height,
              background: '#ffffff',
              enableScroll: false,
              legend: { show: false }, // 使用自定义图例
              padding: [15, 15, 15, 15],
              pixelRatio: uni.getSystemInfoSync().pixelRatio,
              colors: this.colors
            }
            
            // 创建图表实例
            this.chart = new uCharts(options)
            
            // 绘制图表
            this.chart.drawCharts()
          }
        }).exec()
      } catch (error) {
        console.error('渲染图表失败:', error)
      }
    },
    
    // 格式化图表数据
    formatChartData() {
      const total = this.getTotal()
      
      if (this.type === 'pie' || this.type === 'ring') {
        return this.chartData.map(item => ({
          name: item.name,
          data: item.value,
          color: item.color
        }))
      } else if (this.type === 'column') {
        return {
          categories: this.chartData.map(item => item.name),
          series: [
            {
              name: '价值',
              data: this.chartData.map(item => item.value)
            }
          ]
        }
      }
      
      return []
    },
    
    // 获取图表配置
    getChartOptions() {
      const baseOptions = {
        canvasId: this.canvasId,
        type: this.type,
        fontSize: 11,
        dataLabel: true,
        dataPointShape: true,
        animation: true
      }
      
      const data = this.formatChartData()
      
      if (this.type === 'pie' || this.type === 'ring') {
        return {
          ...baseOptions,
          series: data,
          disablePieStroke: true,
          radius: this.type === 'ring' ? 60 : 80,
          extra: {
            pie: {
              activeOpacity: 0.5,
              activeRadius: 10,
              offsetAngle: 0,
              labelWidth: 15
            }
          }
        }
      } else if (this.type === 'column') {
        return {
          ...baseOptions,
          categories: data.categories,
          series: data.series,
          yAxis: {
            disabled: false,
            disableGrid: true,
            gridType: 'dash',
            dashLength: 2
          },
          xAxis: {
            disabled: false,
            disableGrid: true
          },
          extra: {
            column: {
              width: 30
            }
          }
        }
      }
      
      return baseOptions
    },
    
    // 获取总值
    getTotal() {
      if (!this.chartData || this.chartData.length === 0) return 0
      return this.chartData.reduce((sum, item) => sum + (item.value || 0), 0)
    },
    
    // 格式化数值显示
    formatValue(value) {
      if (value === undefined || value === null) return '--'
      
      // 大数字格式化
      if (value >= 1000000) {
        return (value / 1000000).toFixed(2) + 'M'
      } else if (value >= 1000) {
        return (value / 1000).toFixed(2) + 'K'
      } else {
        return value.toFixed(2)
      }
    },
    
    // 计算百分比
    calculatePercent(value) {
      const total = this.getTotal()
      if (!total) return '0%'
      
      return ((value / total) * 100).toFixed(2) + '%'
    },
    
    // 获取颜色
    getColor(index) {
      return this.colors[index % this.colors.length]
    },
    
    // Canvas错误处理
    onCanvasError(e) {
      console.error('Canvas错误:', e)
      this.$emit('error', e)
    }
  }
}
</script>

<style lang="scss">
.asset-chart {
  padding: 20rpx;
  background-color: #fff;
  border-radius: 10rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    
    .chart-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
  }
  
  .chart-container {
    position: relative;
    
    .chart-canvas {
      width: 100%;
    }
    
    .no-data {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.8);
      
      .no-data-text {
        font-size: 28rpx;
        color: #999;
        margin-top: 20rpx;
      }
    }
    
    .loading {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.8);
    }
  }
  
  .chart-legend {
    margin-top: 20rpx;
    
    .legend-item {
      display: flex;
      align-items: center;
      margin-bottom: 10rpx;
      
      .legend-color {
        width: 20rpx;
        height: 20rpx;
        border-radius: 4rpx;
        margin-right: 10rpx;
      }
      
      .legend-name {
        flex: 1;
        font-size: 26rpx;
        color: #333;
      }
      
      .legend-value {
        font-size: 26rpx;
        color: #333;
        margin-right: 15rpx;
      }
      
      .legend-percent {
        width: 80rpx;
        text-align: right;
        font-size: 26rpx;
        color: #666;
      }
    }
  }
}
</style>