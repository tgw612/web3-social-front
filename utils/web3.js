import { ethers } from 'ethers'

// 支持的链类型
export const CHAIN_TYPES = {
  ETH: 'ethereum'
}

// 钱包类型
export const WALLET_TYPES = {
  METAMASK: 'MetaMask',
  COINBASE: 'Coinbase',
  OKX: 'OKX'
}

// 初始化以太坊提供者
export const getEthereumProvider = () => {
  if (typeof window.ethereum !== 'undefined') {
    return new ethers.providers.Web3Provider(window.ethereum)
  }
  
  // 检查UniApp环境
  if (uni.getSystemInfoSync().platform === 'app-plus') {
    const uniEthProvider = uni.requireNativePlugin('UniEthereumProvider')
    if (uniEthProvider) {
      return new ethers.providers.Web3Provider(uniEthProvider)
    }
  }
  
  return null
}

// Solana连接已移除

// 连接以太坊钱包
export const connectEthereumWallet = async (walletType) => {
  try {
    // 特殊处理OKX钱包
    if (walletType === WALLET_TYPES.OKX) {
      // 导入OKX WaaS服务
      const okxWaaSService = await import('@/utils/okx-waas').then(module => module.default)
      
      // 初始化OKX WaaS服务
      await okxWaaSService.initialize()
      
      // 检查是否安装了OKX钱包扩展
      if (okxWaaSService.isOKXWalletInstalled()) {
        try {
          // 使用OKX WaaS服务连接钱包
          const walletInfo = await okxWaaSService.connectWithExtension()
          return walletInfo
        } catch (error) {
          console.error('OKX钱包连接失败：', error)
          throw error
        }
      } else {
        // 如果没有安装OKX钱包扩展，返回需要扫码登录的标志
        return {
          chainType: CHAIN_TYPES.ETH,
          walletType: 'OKX_QRCODE',
          needQRCode: true
        }
      }
    }
    
    // 其他钱包的处理逻辑
    const provider = getEthereumProvider()
    if (!provider) {
      throw new Error('以太坊提供者不可用，请确保已安装钱包扩展或应用')
    }
    
    // 请求账户访问权限
    const accounts = await provider.send('eth_requestAccounts', [])
    if (!accounts || accounts.length === 0) {
      throw new Error('没有授权访问账户')
    }
    
    // 获取账户余额
    const address = accounts[0]
    const balance = await provider.getBalance(address)
    const balanceInEth = ethers.utils.formatEther(balance)
    
    // 获取链ID
    const { chainId } = await provider.getNetwork()
    
    return {
      chainType: CHAIN_TYPES.ETH,
      walletType,
      address,
      balance: balanceInEth,
      chainId
    }
  } catch (error) {
    console.error('连接以太坊钱包失败：', error)
    throw error
  }
}

// Solana钱包连接已移除

// 签名消息
export const signMessage = async (message, chainType, address) => {
  try {
    if (chainType === CHAIN_TYPES.ETH) {
      const provider = getEthereumProvider()
      const signer = provider.getSigner(address)
      return await signer.signMessage(message)
    }
    
    throw new Error('不支持的链类型')
  } catch (error) {
    console.error('签名消息失败：', error)
    throw error
  }
}

// 检查钱包是否已连接
export const isWalletConnected = async (chainType, address) => {
  try {
    if (chainType === CHAIN_TYPES.ETH) {
      const provider = getEthereumProvider()
      if (!provider) return false
      
      const accounts = await provider.listAccounts()
      return accounts.includes(address)
    }
    
    return false
  } catch (error) {
    console.error('检查钱包连接状态失败：', error)
    return false
  }
}

// 断开钱包连接
export const disconnectWallet = async (chainType) => {
  try {
    // 以太坊钱包通常不需要主动断开，只需清除本地状态
    return true
  } catch (error) {
    console.error('断开钱包连接失败：', error)
    throw error
  }
}