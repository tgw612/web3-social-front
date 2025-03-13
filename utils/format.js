import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'

// 配置dayjs
dayjs.locale('zh-cn')
dayjs.extend(relativeTime)

/**
 * 格式化钱包地址，中间部分用...替代
 * @param {string} address - 钱包地址
 * @param {number} prefixLength - 前缀长度
 * @param {number} suffixLength - 后缀长度
 * @returns {string} - 格式化后的地址
 */
export const formatAddress = (address, prefixLength = 6, suffixLength = 4) => {
  if (!address) return ''
  if (address.length <= prefixLength + suffixLength) return address
  
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`
}

/**
 * 格式化货币金额
 * @param {number|string} amount - 金额
 * @param {number} decimals - 小数位数
 * @param {string} symbol - 货币符号
 * @returns {string} - 格式化后的金额
 */
export const formatAmount = (amount, decimals = 4, symbol = '') => {
  if (amount === undefined || amount === null) return '--'
  
  let num = Number(amount)
  if (isNaN(num)) return '--'
  
  // 处理小于0.0001的情况
  if (num > 0 && num < 0.0001) {
    return `<0.0001 ${symbol}`.trim()
  }
  
  // 格式化数字
  num = Math.floor(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
  
  // 添加千分位分隔符
  const parts = num.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  return `${parts.join('.')} ${symbol}`.trim()
}

/**
 * 格式化时间为相对时间（如：3小时前）
 * @param {string|number|Date} time - 时间
 * @returns {string} - 相对时间
 */
export const formatRelativeTime = (time) => {
  if (!time) return ''
  return dayjs(time).fromNow()
}

/**
 * 格式化时间为指定格式
 * @param {string|number|Date} time - 时间
 * @param {string} format - 格式
 * @returns {string} - 格式化后的时间
 */
export const formatTime = (time, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!time) return ''
  return dayjs(time).format(format)
}

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} - 格式化后的文件大小
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

/**
 * 计算百分比
 * @param {number} value - 值
 * @param {number} total - 总值
 * @param {number} decimals - 小数位数
 * @returns {string} - 百分比
 */
export const formatPercent = (value, total, decimals = 2) => {
  if (!value || !total) return '0%'
  
  const percent = (value / total) * 100
  return percent.toFixed(decimals) + '%'
}

/**
 * 格式化交易哈希值
 * @param {string} hash - 交易哈希
 * @param {number} length - 显示长度
 * @returns {string} - 格式化后的哈希
 */
export const formatTxHash = (hash, length = 8) => {
  if (!hash) return ''
  if (hash.length <= length * 2) return hash
  
  return `${hash.slice(0, length)}...${hash.slice(-length)}`
}

/**
 * 格式化数字为简短形式（如：1.5k, 2.3M）
 * @param {number} num - 数字
 * @returns {string} - 格式化后的数字
 */
export const formatShortNumber = (num) => {
  if (num === null || num === undefined) return '--'
  
  if (num < 1000) return num.toString()
  
  const units = ['', 'k', 'M', 'B', 'T']
  const order = Math.floor(Math.log10(num) / 3)
  
  const unitValue = num / Math.pow(10, order * 3)
  return unitValue.toFixed(1) + units[order]
} 