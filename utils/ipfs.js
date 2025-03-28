// 导入IPFS HTTP客户端
import { create as ipfsClient } from 'ipfs-http-client'

// IPFS默认配置
const DEFAULT_IPFS_CONFIG = {
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
}

let ipfs = null

/**
 * 创建IPFS客户端
 * @param {Object} config - IPFS配置
 * @returns {Object} - IPFS客户端实例
 */
export const createIpfsClient = (config = DEFAULT_IPFS_CONFIG) => {
  try {
    ipfs = ipfsClient(config)
    console.log('IPFS客户端初始化成功')
    return ipfs
  } catch (error) {
    console.error('IPFS客户端初始化失败：', error)
    return null
  }
}

/**
 * 获取IPFS客户端实例
 * @returns {Object} - IPFS客户端实例
 */
export const getIpfsClient = () => {
  if (!ipfs) {
    return createIpfsClient()
  }
  return ipfs
}

/**
 * 将文件上传到IPFS
 * @param {File} file - 要上传的文件
 * @returns {Promise<string>} - 返回IPFS CID
 */
export const uploadFileToIpfs = async (file) => {
  try {
    const client = getIpfsClient()
    if (!client) {
      throw new Error('IPFS客户端未初始化')
    }
    
    // 将文件转为Buffer
    const buffer = await fileToBuffer(file)
    
    // 上传到IPFS
    const result = await client.add(buffer, {
      progress: (prog) => console.log(`上传进度: ${prog}`)
    })
    
    return result.path
  } catch (error) {
    console.error('上传文件到IPFS失败：', error)
    throw error
  }
}

/**
 * 将对象内容上传到IPFS
 * @param {Object} content - 要存储的对象内容
 * @returns {Promise<string>} - 返回IPFS CID
 */
export const uploadJsonToIpfs = async (content) => {
  try {
    const client = getIpfsClient()
    if (!client) {
      throw new Error('IPFS客户端未初始化')
    }
    
    // 将JSON对象转为字符串
    const jsonString = JSON.stringify(content)
    
    // 上传到IPFS
    const result = await client.add(Buffer.from(jsonString))
    
    return result.path
  } catch (error) {
    console.error('上传JSON到IPFS失败：', error)
    throw error
  }
}

/**
 * 从IPFS获取JSON数据
 * @param {string} cid - IPFS内容ID
 * @returns {Promise<Object>} - 返回JSON对象
 */
export const getJsonFromIpfs = async (cid) => {
  try {
    const client = getIpfsClient()
    if (!client) {
      throw new Error('IPFS客户端未初始化')
    }
    
    // 从IPFS获取内容
    const stream = client.cat(cid)
    let data = ''
    
    for await (const chunk of stream) {
      data += chunk.toString()
    }
    
    return JSON.parse(data)
  } catch (error) {
    console.error('从IPFS获取JSON失败：', error)
    throw error
  }
}

/**
 * 生成IPFS资源的访问URL
 * @param {string} cid - IPFS内容ID
 * @returns {string} - IPFS公共网关URL
 */
export const getIpfsUrl = (cid) => {
  if (!cid) return ''
  return `https://ipfs.io/ipfs/${cid}`
}

/**
 * 将文件转换为Buffer
 * @param {File} file - 文件对象
 * @returns {Promise<Buffer>} - Buffer对象
 */
const fileToBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const buffer = Buffer.from(reader.result)
      resolve(buffer)
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}