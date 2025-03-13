import { ethers } from 'ethers'
import Vue from 'vue'

class Web3Service {
  constructor() {
    this.provider = null
    this.signer = null
    this.address = null
    this.chainId = null
    this.isConnected = false
    this.supportedWallets = ['MetaMask', 'WalletConnect', 'OKX', 'Coinbase', 'Binance']
  }

  // 初始化Web3
  async initialize() {
    try {
      // 检查环境是否支持Web3
      if (typeof window !== 'undefined' && window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum)
        console.log('Web3服务初始化成功')
        return true
      } else {
        console.warn('当前环境不支持Web3')
        return false
      }
    } catch (error) {
      console.error('Web3服务初始化失败:', error)
      return false
    }
  }

  // 连接钱包
  async connectWallet(walletType = 'MetaMask') {
    try {
      if (!this.provider) {
        await this.initialize()
      }

      // 处理不同钱包类型的连接
      switch (walletType) {
        case 'MetaMask':
          if (window.ethereum) {
            this.signer = await this.provider.getSigner()
            this.address = await this.signer.getAddress()
            this.chainId = await this.getChainId()
            this.isConnected = true
            
            return {
              success: true,
              address: this.address,
              chainId: this.chainId,
              walletType
            }
          } else {
            throw new Error('请安装MetaMask插件')
          }

        case 'OKX':
          // OKX钱包集成
          if (window.okxwallet) {
            const accounts = await window.okxwallet.request({ method: 'eth_requestAccounts' })
            this.address = accounts[0]
            this.provider = new ethers.BrowserProvider(window.okxwallet)
            this.signer = await this.provider.getSigner()
            this.chainId = await this.getChainId()
            this.isConnected = true
            
            return {
              success: true,
              address: this.address,
              chainId: this.chainId,
              walletType
            }
          } else {
            throw new Error('请安装OKX钱包')
          }

        case 'Coinbase':
          // Coinbase钱包集成
          if (window.coinbaseWalletExtension) {
            const accounts = await window.coinbaseWalletExtension.request({ method: 'eth_requestAccounts' })
            this.address = accounts[0]
            this.provider = new ethers.BrowserProvider(window.coinbaseWalletExtension)
            this.signer = await this.provider.getSigner()
            this.chainId = await this.getChainId()
            this.isConnected = true
            
            return {
              success: true,
              address: this.address,
              chainId: this.chainId,
              walletType
            }
          } else {
            throw new Error('请安装Coinbase钱包')
          }

        // 可以添加更多钱包支持
        default:
          throw new Error(`不支持的钱包类型: ${walletType}`)
      }
    } catch (error) {
      console.error('连接钱包失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 检查钱包连接状态
  async checkConnection() {
    try {
      if (!this.provider) {
        return false
      }

      const accounts = await this.provider.listAccounts()
      this.isConnected = accounts.length > 0
      return this.isConnected
    } catch (error) {
      console.error('检查钱包连接失败:', error)
      return false
    }
  }

  // 获取当前链ID
  async getChainId() {
    try {
      if (!this.provider) return null
      const network = await this.provider.getNetwork()
      return network.chainId.toString()
    } catch (error) {
      console.error('获取链ID失败:', error)
      return null
    }
  }

  // 获取代币余额
  async getTokenBalance(tokenAddress, decimals = 18) {
    try {
      if (!this.isConnected || !this.address) throw new Error('钱包未连接')

      // ERC20代币ABI
      const erc20Abi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)'
      ]

      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, this.provider)
      const balance = await tokenContract.balanceOf(this.address)
      
      // 格式化余额
      const formattedBalance = ethers.formatUnits(balance, decimals)
      
      return {
        success: true,
        balance: formattedBalance,
        rawBalance: balance.toString()
      }
    } catch (error) {
      console.error('获取代币余额失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 获取ETH余额
  async getEthBalance() {
    try {
      if (!this.isConnected || !this.address) throw new Error('钱包未连接')

      const balance = await this.provider.getBalance(this.address)
      const formattedBalance = ethers.formatEther(balance)
      
      return {
        success: true,
        balance: formattedBalance,
        rawBalance: balance.toString()
      }
    } catch (error) {
      console.error('获取ETH余额失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 签名消息
  async signMessage(message) {
    try {
      if (!this.isConnected || !this.signer) throw new Error('钱包未连接')

      const signature = await this.signer.signMessage(message)
      return { success: true, signature }
    } catch (error) {
      console.error('签名消息失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 断开钱包连接
  async disconnect() {
    this.provider = null
    this.signer = null
    this.address = null
    this.chainId = null
    this.isConnected = false
    return true
  }
}

// 创建实例并注入到Vue原型
const web3Service = new Web3Service()
Vue.prototype.$web3Service = web3Service

export default web3Service 