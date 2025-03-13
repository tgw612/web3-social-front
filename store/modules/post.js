import api from '@/utils/api'
import { uploadFileToIpfs, uploadJsonToIpfs } from '@/utils/ipfs'

// 初始状态
const state = {
  // 帖子列表
  posts: [],
  
  // 当前查看的帖子详情
  currentPost: null,
  
  // 评论列表
  comments: [],
  
  // 分页信息
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    hasMore: true
  },
  
  // 是否加载中
  loading: false,
  
  // 发布状态
  publishing: false,
  
  // 错误信息
  error: null,
  
  // 排序方式
  sortBy: 'latest' // 'latest', 'hot'
}

// getter
const getters = {
  // 热门帖子
  hotPosts: state => {
    return [...state.posts].sort((a, b) => {
      const aScore = (a.likeCount || 0) * 2 + (a.commentCount || 0)
      const bScore = (b.likeCount || 0) * 2 + (b.commentCount || 0)
      return bScore - aScore
    })
  },
  
  // 是否有更多帖子
  hasMorePosts: state => state.pagination.hasMore,
  
  // 当前帖子ID
  currentPostId: state => state.currentPost ? state.currentPost.id : null
}

// 突变
const mutations = {
  // 设置帖子列表
  SET_POSTS(state, posts) {
    state.posts = posts
  },
  
  // 添加帖子到列表
  ADD_POSTS(state, posts) {
    state.posts = [...state.posts, ...posts]
  },
  
  // 设置当前帖子
  SET_CURRENT_POST(state, post) {
    state.currentPost = post
  },
  
  // 设置评论列表
  SET_COMMENTS(state, comments) {
    state.comments = comments
  },
  
  // 添加评论到列表
  ADD_COMMENTS(state, comments) {
    state.comments = [...state.comments, ...comments]
  },
  
  // 添加一条评论
  ADD_COMMENT(state, comment) {
    state.comments.unshift(comment)
    
    // 更新当前帖子的评论数
    if (state.currentPost) {
      state.currentPost.commentCount = (state.currentPost.commentCount || 0) + 1
    }
  },
  
  // 设置分页信息
  SET_PAGINATION(state, pagination) {
    state.pagination = { ...state.pagination, ...pagination }
  },
  
  // 设置加载状态
  SET_LOADING(state, status) {
    state.loading = status
  },
  
  // 设置发布状态
  SET_PUBLISHING(state, status) {
    state.publishing = status
  },
  
  // 设置错误信息
  SET_ERROR(state, error) {
    state.error = error
  },
  
  // 设置排序方式
  SET_SORT_BY(state, sortBy) {
    state.sortBy = sortBy
  },
  
  // 更新点赞状态
  UPDATE_LIKE_STATUS(state, { postId, isLiked, likeCount }) {
    // 更新列表中的帖子
    const postIndex = state.posts.findIndex(post => post.id === postId)
    if (postIndex !== -1) {
      state.posts[postIndex].isLiked = isLiked
      state.posts[postIndex].likeCount = likeCount
    }
    
    // 更新当前帖子
    if (state.currentPost && state.currentPost.id === postId) {
      state.currentPost.isLiked = isLiked
      state.currentPost.likeCount = likeCount
    }
  },
  
  // 清除帖子数据
  CLEAR_POSTS(state) {
    state.posts = []
    state.currentPost = null
    state.comments = []
    state.pagination = {
      page: 1,
      pageSize: 10,
      total: 0,
      hasMore: true
    }
  }
}

// 动作
const actions = {
  // 获取帖子列表
  async fetchPosts({ commit, state }, { reset = false, page, pageSize, sortBy } = {}) {
    try {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      // 确定查询参数
      const params = {
        page: page || (reset ? 1 : state.pagination.page),
        pageSize: pageSize || state.pagination.pageSize,
        sortBy: sortBy || state.sortBy
      }
      
      // 重置列表
      if (reset) {
        commit('SET_POSTS', [])
      }
      
      // 获取帖子列表
      const response = await api.get('/post/list', params)
      
      // 更新状态
      if (reset || params.page === 1) {
        commit('SET_POSTS', response.items)
      } else {
        commit('ADD_POSTS', response.items)
      }
      
      // 更新分页信息
      commit('SET_PAGINATION', {
        page: params.page + 1,
        total: response.total,
        hasMore: response.hasMore
      })
      
      // 更新排序方式
      if (sortBy) {
        commit('SET_SORT_BY', sortBy)
      }
      
      return response
    } catch (error) {
      console.error('获取帖子列表失败：', error)
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  // 获取帖子详情
  async fetchPostDetail({ commit }, postId) {
    try {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      // 获取帖子详情
      const post = await api.get(`/post/detail/${postId}`)
      
      // 更新状态
      commit('SET_CURRENT_POST', post)
      
      return post
    } catch (error) {
      console.error('获取帖子详情失败：', error)
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  // 获取评论列表
  async fetchComments({ commit, state }, { postId, reset = false, page, pageSize } = {}) {
    try {
      commit('SET_LOADING', true)
      
      // 确定查询参数
      const params = {
        postId,
        page: page || (reset ? 1 : state.pagination.page),
        pageSize: pageSize || state.pagination.pageSize
      }
      
      // 重置列表
      if (reset) {
        commit('SET_COMMENTS', [])
      }
      
      // 获取评论列表
      const response = await api.get('/post/comments', params)
      
      // 更新状态
      if (reset || params.page === 1) {
        commit('SET_COMMENTS', response.items)
      } else {
        commit('ADD_COMMENTS', response.items)
      }
      
      // 更新分页信息
      commit('SET_PAGINATION', {
        page: params.page + 1,
        total: response.total,
        hasMore: response.hasMore
      })
      
      return response
    } catch (error) {
      console.error('获取评论列表失败：', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  // 发布帖子
  async createPost({ commit, rootState }, postData) {
    try {
      commit('SET_PUBLISHING', true)
      commit('SET_ERROR', null)
      
      const { address } = rootState.wallet
      
      if (!address) {
        throw new Error('请先连接钱包')
      }
      
      let ipfsCid = null
      
      // 上传图片到IPFS
      if (postData.images && postData.images.length > 0) {
        const imagePromises = postData.images.map(image => uploadFileToIpfs(image))
        const imageCids = await Promise.all(imagePromises)
        
        // 替换图片路径为IPFS路径
        postData.imageCids = imageCids
      }
      
      // 如果有交易哈希，添加到帖子数据中
      if (postData.transactionHash) {
        postData.transactionInfo = {
          hash: postData.transactionHash,
          chainType: rootState.wallet.chainType
        }
      }
      
      // 准备要存储的帖子内容
      const postContent = {
        content: postData.content,
        imageCids: postData.imageCids || [],
        transactionInfo: postData.transactionInfo,
        tags: postData.tags || [],
        timestamp: Date.now()
      }
      
      // 将完整内容上传到IPFS
      ipfsCid = await uploadJsonToIpfs(postContent)
      
      // 构建请求数据
      const requestData = {
        title: postData.title,
        summary: postData.content.slice(0, 100),
        contentCid: ipfsCid,
        tags: postData.tags || [],
        address,
        chainType: rootState.wallet.chainType
      }
      
      // 发送请求
      const newPost = await api.post('/post/create', requestData)
      
      return newPost
    } catch (error) {
      console.error('发布帖子失败：', error)
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_PUBLISHING', false)
    }
  },
  
  // 发布评论
  async createComment({ commit, rootState }, { postId, content }) {
    try {
      commit('SET_PUBLISHING', true)
      
      const { address } = rootState.wallet
      
      if (!address) {
        throw new Error('请先连接钱包')
      }
      
      // 发送请求
      const comment = await api.post('/post/comment', {
        postId,
        content,
        address,
        chainType: rootState.wallet.chainType
      })
      
      // 更新状态
      commit('ADD_COMMENT', comment)
      
      return comment
    } catch (error) {
      console.error('发布评论失败：', error)
      throw error
    } finally {
      commit('SET_PUBLISHING', false)
    }
  },
  
  // 点赞/取消点赞帖子
  async toggleLike({ commit, rootState }, postId) {
    try {
      const { address } = rootState.wallet
      
      if (!address) {
        throw new Error('请先连接钱包')
      }
      
      // 发送请求
      const result = await api.post('/post/like', {
        postId,
        address
      })
      
      // 更新状态
      commit('UPDATE_LIKE_STATUS', {
        postId,
        isLiked: result.isLiked,
        likeCount: result.likeCount
      })
      
      return result
    } catch (error) {
      console.error('点赞操作失败：', error)
      throw error
    }
  },
  
  // 获取用户发布的帖子
  async fetchUserPosts({ commit }, { userId, page = 1, pageSize = 10 }) {
    try {
      commit('SET_LOADING', true)
      
      // 获取用户帖子
      const response = await api.get('/post/user-posts', {
        userId,
        page,
        pageSize
      })
      
      return response
    } catch (error) {
      console.error('获取用户帖子失败：', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  // 按标签搜索帖子
  async searchPostsByTag({ commit }, { tag, page = 1, pageSize = 10 }) {
    try {
      commit('SET_LOADING', true)
      
      // 搜索帖子
      const response = await api.get('/post/search', {
        tag,
        page,
        pageSize
      })
      
      return response
    } catch (error) {
      console.error('搜索帖子失败：', error)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} 