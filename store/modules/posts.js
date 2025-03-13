import api from '@/utils/api'

const state = {
  posts: [],
  userPosts: [], // 当前用户的帖子
  currentPost: null,
  comments: [],
  loading: false,
  refreshing: false,
  hasMore: true,
  page: 1,
  pageSize: 10,
  totalPosts: 0
}

const mutations = {
  SET_POSTS(state, posts) {
    state.posts = posts
  },
  APPEND_POSTS(state, posts) {
    state.posts = [...state.posts, ...posts]
  },
  SET_USER_POSTS(state, posts) {
    state.userPosts = posts
  },
  SET_CURRENT_POST(state, post) {
    state.currentPost = post
  },
  SET_COMMENTS(state, comments) {
    state.comments = comments
  },
  APPEND_COMMENTS(state, comments) {
    state.comments = [...state.comments, ...comments]
  },
  ADD_COMMENT(state, comment) {
    state.comments = [comment, ...state.comments]
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_REFRESHING(state, refreshing) {
    state.refreshing = refreshing
  },
  SET_HAS_MORE(state, hasMore) {
    state.hasMore = hasMore
  },
  SET_PAGE(state, page) {
    state.page = page
  },
  INCREMENT_PAGE(state) {
    state.page += 1
  },
  SET_TOTAL_POSTS(state, total) {
    state.totalPosts = total
  },
  ADD_POST(state, post) {
    state.posts = [post, ...state.posts]
    state.totalPosts += 1
  },
  UPDATE_LIKE_STATUS(state, { postId, isLiked, likesCount }) {
    state.posts = state.posts.map(post => {
      if (post.id === postId) {
        return { ...post, isLiked, likesCount }
      }
      return post
    })
    
    state.userPosts = state.userPosts.map(post => {
      if (post.id === postId) {
        return { ...post, isLiked, likesCount }
      }
      return post
    })
    
    if (state.currentPost && state.currentPost.id === postId) {
      state.currentPost = { ...state.currentPost, isLiked, likesCount }
    }
  }
}

const actions = {
  // 获取帖子列表
  async fetchPosts({ commit, state }, { refresh = false, sortBy = 'latest' } = {}) {
    try {
      if (refresh) {
        commit('SET_REFRESHING', true)
        commit('SET_PAGE', 1)
      } else {
        commit('SET_LOADING', true)
      }
      
      const { page, pageSize } = state
      const { data } = await api.getPosts({ page, pageSize, sortBy })
      
      if (data) {
        const { list, total } = data
        
        if (refresh) {
          commit('SET_POSTS', list)
        } else {
          commit('APPEND_POSTS', list)
        }
        
        commit('SET_TOTAL_POSTS', total)
        commit('SET_HAS_MORE', list.length === pageSize)
        
        if (list.length > 0) {
          commit('INCREMENT_PAGE')
        }
      }
    } catch (error) {
      console.error('获取帖子列表失败', error)
    } finally {
      commit('SET_LOADING', false)
      commit('SET_REFRESHING', false)
    }
  },
  
  // 获取用户的帖子
  async fetchUserPosts({ commit }, { address, page = 1, pageSize = 10 }) {
    try {
      commit('SET_LOADING', true)
      
      const { data } = await api.getUserPosts({ address, page, pageSize })
      
      if (data && data.list) {
        commit('SET_USER_POSTS', data.list)
      }
    } catch (error) {
      console.error('获取用户帖子失败', error)
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  // 获取帖子详情
  async fetchPostDetail({ commit }, id) {
    try {
      commit('SET_LOADING', true)
      
      const { data } = await api.getPostDetail(id)
      
      if (data) {
        commit('SET_CURRENT_POST', data)
      }
    } catch (error) {
      console.error('获取帖子详情失败', error)
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  // 获取帖子评论
  async fetchComments({ commit }, { postId, page = 1, pageSize = 20, refresh = false }) {
    try {
      if (refresh) {
        commit('SET_COMMENTS', [])
      }
      
      commit('SET_LOADING', true)
      
      const { data } = await api.getComments({ postId, page, pageSize })
      
      if (data && data.list) {
        if (refresh) {
          commit('SET_COMMENTS', data.list)
        } else {
          commit('APPEND_COMMENTS', data.list)
        }
      }
    } catch (error) {
      console.error('获取评论失败', error)
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  // 发布帖子
  async createPost({ commit, rootState }, postData) {
    try {
      if (!rootState.user.isLoggedIn) {
        return { success: false, message: '请先登录' }
      }
      
      commit('SET_LOADING', true)
      
      // 添加用户地址
      const postWithAddress = {
        ...postData,
        userAddress: rootState.user.walletInfo.address
      }
      
      // 如果有图片，先上传到IPFS
      if (postData.images && postData.images.length > 0) {
        const uploadResults = []
        
        for (const image of postData.images) {
          const { data } = await api.uploadToIPFS(image)
          if (data && data.ipfsUrl) {
            uploadResults.push(data.ipfsUrl)
          }
        }
        
        postWithAddress.imageUrls = uploadResults
      }
      
      const { data } = await api.createPost(postWithAddress)
      
      if (data) {
        commit('ADD_POST', data)
        return { success: true, postId: data.id }
      }
      
      return { success: false, message: '发布失败' }
    } catch (error) {
      console.error('发布帖子失败', error)
      return { success: false, error, message: '发布失败' }
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  // 发表评论
  async createComment({ commit, rootState }, { postId, content }) {
    try {
      if (!rootState.user.isLoggedIn) {
        return { success: false, message: '请先登录' }
      }
      
      // 添加用户地址
      const commentData = {
        postId,
        content,
        userAddress: rootState.user.walletInfo.address
      }
      
      const { data } = await api.createComment(commentData)
      
      if (data) {
        commit('ADD_COMMENT', data)
        return { success: true, commentId: data.id }
      }
      
      return { success: false, message: '评论失败' }
    } catch (error) {
      console.error('评论失败', error)
      return { success: false, error, message: '评论失败' }
    }
  },
  
  // 点赞/取消点赞
  async toggleLike({ commit, rootState }, { postId, isLiked }) {
    try {
      if (!rootState.user.isLoggedIn) {
        return { success: false, message: '请先登录' }
      }
      
      const userAddress = rootState.user.walletInfo.address
      const { data } = await api.toggleLike({ postId, userAddress, isLiked })
      
      if (data) {
        commit('UPDATE_LIKE_STATUS', {
          postId,
          isLiked: data.isLiked,
          likesCount: data.likesCount
        })
        return { success: true }
      }
      
      return { success: false, message: '操作失败' }
    } catch (error) {
      console.error('点赞操作失败', error)
      return { success: false, error, message: '操作失败' }
    }
  }
}

const getters = {
  postsList: state => state.posts,
  userPostsList: state => state.userPosts,
  currentPostDetail: state => state.currentPost,
  commentsList: state => state.comments,
  isLoading: state => state.loading,
  isRefreshing: state => state.refreshing,
  hasMorePosts: state => state.hasMore,
  postsByTag: state => tag => {
    return state.posts.filter(post => post.tags && post.tags.includes(tag))
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
} 