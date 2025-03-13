<script>
export default {
  onLaunch: function() {
    console.log('App Launch')
    // 检查钱包连接状态
    this.checkWalletConnection()
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  },
  methods: {
    // 检查钱包连接状态
    checkWalletConnection() {
      try {
        const walletInfo = uni.getStorageSync('walletInfo')
        if (walletInfo) {
          // 恢复钱包连接
          this.$store.dispatch('wallet/restoreConnection', JSON.parse(walletInfo))
        }
      } catch (e) {
        console.error('检查钱包连接状态失败:', e)
      }
    }
  }
}
</script>

<style>
/*每个页面公共css */
page {
  font-size: 28rpx;
  color: #333;
  background-color: #f5f7fa;
}

.container {
  padding: 20rpx;
}

.flex-row {
  display: flex;
  flex-direction: row;
}

.flex-column {
  display: flex;
  flex-direction: column;
}

.justify-between {
  justify-content: space-between;
}

.justify-center {
  justify-content: center;
}

.align-center {
  align-items: center;
}

.text-center {
  text-align: center;
}

.primary-btn {
  background-color: #3cc51f;
  color: #ffffff;
  border-radius: 8rpx;
  padding: 20rpx 40rpx;
  font-size: 30rpx;
}

.secondary-btn {
  background-color: #f0f0f0;
  color: #333333;
  border-radius: 8rpx;
  padding: 20rpx 40rpx;
  font-size: 30rpx;
}

.card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

/* 简化的字号系统 */
.text-xs { font-size: 24rpx; }
.text-sm { font-size: 28rpx; }
.text-md { font-size: 32rpx; }
.text-lg { font-size: 36rpx; }
.text-xl { font-size: 40rpx; }

/* 主要色彩 */
.text-primary { color: #3cc51f; }
.text-secondary { color: #666666; }
.text-muted { color: #999999; }
.text-danger { color: #ff4d4f; }
.text-warning { color: #faad14; }
.text-success { color: #52c41a; }

/* 间距 */
.mt-10 { margin-top: 10rpx; }
.mt-20 { margin-top: 20rpx; }
.mb-10 { margin-bottom: 10rpx; }
.mb-20 { margin-bottom: 20rpx; }
.ml-10 { margin-left: 10rpx; }
.mr-10 { margin-right: 10rpx; }
.pa-20 { padding: 20rpx; }
</style> 