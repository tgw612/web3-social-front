import { ethers } from 'ethers'
import { Connection, PublicKey } from '@solana/web3.js'

// 支持的链类型
export const CHAIN_TYPES = {
  ETH: 'ethereum',
  SOL: 'solana'
}

// 钱包类型
export const WALLET_TYPES = {
  METAMASK: 'MetaMask',
  COINBASE: 'Coinbase',
  PHANTOM: 'Phantom',
  SOLFLARE: 'Solflare',
  OKX: 'OKX',
  BINANCE: 'Binance'
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

// 初始化Solana连接
export const getSolanaConnection = () => {
  // 可以根据环境选择不同的网络
  return new Connection('https://api.mainnet-beta.solana.com')
}

// 连接以太坊钱包
export const connectEthereumWallet = async (walletType) => {
  try {
    // 特殊处理OKX钱包
    if (walletType === WALLET_TYPES.OKX) {
      // 检查是否安装了OKX钱包扩展
      if (window.okxwallet) {
        try {
          const accounts = await window.okxwallet.request({ method: 'eth_requestAccounts' })
          if (!accounts || accounts.length === 0) {
            throw new Error('没有授权访问账户')
          }
          
          const provider = new ethers.providers.Web3Provider(window.okxwallet)
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
          console.error('OKX钱包连接失败：', error)
          throw error
        }
      } else {
        // 如果没有安装OKX钱包扩展，返回需要扫码登录的标志
        // 实际项目中，这里可以调用OKX钱包的API生成二维码
        // 参考: https://www.okx.com/web3/build/docs/connect/qrcode
        return {
          chainType: CHAIN_TYPES.ETH,
          walletType: 'OKX_QRCODE',
          needQRCode: true,
          // 在实际项目中，可以在这里添加生成二维码的URL或数据
          // qrcodeData: await generateOKXQRCode()
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

// 连接Solana钱包
export const connectSolanaWallet = async (walletType) => {
  try {
    let walletProvider = null
    
    // 根据不同钱包类型获取对应的提供者
    if (walletType === WALLET_TYPES.PHANTOM) {
      walletProvider = window.solana
    } else if (walletType === WALLET_TYPES.SOLFLARE) {
      walletProvider = window.solflare
    }
    
    if (!walletProvider) {
      throw new Error(`${walletType} 钱包不可用，请确保已安装钱包扩展或应用`)
    }
    
    // 请求连接
    const response = await walletProvider.connect()
    const address = response.publicKey.toString()
    
    // 获取账户余额
    const connection = getSolanaConnection()
    const balance = await connection.getBalance(new PublicKey(address))
    const balanceInSOL = balance / 1000000000 // 转换为SOL单位
    
    return {
      chainType: CHAIN_TYPES.SOL,
      walletType,
      address,
      balance: balanceInSOL
    }
  } catch (error) {
    console.error('连接Solana钱包失败：', error)
    throw error
  }
}

// 签名消息
export const signMessage = async (message, chainType, address) => {
  try {
    if (chainType === CHAIN_TYPES.ETH) {
      const provider = getEthereumProvider()
      const signer = provider.getSigner(address)
      return await signer.signMessage(message)
    } else if (chainType === CHAIN_TYPES.SOL) {
      // 根据当前连接的钱包选择合适的提供者
      const walletProvider = window.solana || window.solflare
      if (!walletProvider) {
        throw new Error('Solana钱包不可用')
      }
      
      // 编码消息
      const encodedMessage = new TextEncoder().encode(message)
      
      // 签名
      const signedMessage = await walletProvider.signMessage(encodedMessage, 'utf8')
      return signedMessage.signature
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
    } else if (chainType === CHAIN_TYPES.SOL) {
      const walletProvider = window.solana || window.solflare
      if (!walletProvider) return false
      
      return !!walletProvider.publicKey && walletProvider.publicKey.toString() === address
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
    if (chainType === CHAIN_TYPES.SOL) {
      const walletProvider = window.solana || window.solflare
      if (walletProvider && walletProvider.disconnect) {
        await walletProvider.disconnect()
      }
    }
    // 以太坊钱包通常不需要主动断开，只需清除本地状态
    
    return true
  } catch (error) {
    console.error('断开钱包连接失败：', error)
    throw error
  }
}