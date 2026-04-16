// frontend/src/stores/user.js
// frontend/src/stores/user.js

import { defineStore } from 'pinia'
import { userApi } from '../api/user'

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null,
    users: [],
    loading: false
  }),
  
  actions: {
    async register(userData) {
      this.loading = true
      try {
        const response = await userApi.register(userData)
        return { success: true, data: response.data }
      } catch (error) {
        return { success: false, message: error.response?.data || error.message }
      } finally {
        this.loading = false
      }
    },
    
    async fetchProfile() {
      this.loading = true
      try {
        const response = await userApi.getProfile()
        this.currentUser = response.data
        // 儲存管理員狀態到 localStorage
        if (this.currentUser.is_staff) {
          localStorage.setItem('isAdmin', 'true')
        } else {
          localStorage.removeItem('isAdmin')
        }
        return { success: true, data: response.data }
      } catch (error) {
        console.warn('無法獲取使用者資料:', error.message)
        return { success: false, message: error.message }
      } finally {
        this.loading = false
      }
    },

    // async fetchProfile() {
    //   this.loading = true
    //   try {
    //     const response = await userApi.getProfile()
    //     this.currentUser = response.data
    //     return { success: true, data: response.data }
    //   } catch (error) {
    //     console.warn('無法獲取使用者資料，可能是後端未啟動:', error.message)
    //     // 不回報錯誤，讓前端繼續運作
    //     return { success: false, message: error.message }
    //   } finally {
    //     this.loading = false
    //   }
    // },
    
    async updateProfile(data) {
      this.loading = true
      try {
        const response = await userApi.updateProfile(data)
        this.currentUser = response.data
        return { success: true, data: response.data }
      } catch (error) {
        return { success: false, message: error.response?.data || error.message }
      } finally {
        this.loading = false
      }
    },
    
    async changePassword(data) {
      this.loading = true
      try {
        await userApi.changePassword(data)
        return { success: true }
      } catch (error) {
        return { success: false, message: error.response?.data || error.message }
      } finally {
        this.loading = false
      }
    },
    
    async fetchAllUsers() {
      this.loading = true
      try {
        const response = await userApi.getUsers()
        this.users = response.data
        return { success: true, data: response.data }
      } catch (error) {
        return { success: false, message: error.message }
      } finally {
        this.loading = false
      }
    },
    
    async deleteUser(userId) {
      this.loading = true
      try {
        await userApi.deleteUser(userId)
        this.users = this.users.filter(u => u.id !== userId)
        return { success: true }
      } catch (error) {
        return { success: false, message: error.message }
      } finally {
        this.loading = false
      }
    },
    
    async deleteSelf() {
      this.loading = true
      try {
        await userApi.deleteSelf()
        return { success: true }
      } catch (error) {
        return { success: false, message: error.message }
      } finally {
        this.loading = false
      }
    }
  }
})



// import { defineStore } from 'pinia'
// import { userApi } from '../api/user'

// export const useUserStore = defineStore('user', {
//   state: () => ({
//     currentUser: null,
//     users: [],
//     loading: false
//   }),
  
//   actions: {
//     async register(userData) {
//       this.loading = true
//       try {
//         const response = await userApi.register(userData)
//         return { success: true, data: response.data }
//       } catch (error) {
//         return { success: false, message: error.response?.data || error.message }
//       } finally {
//         this.loading = false
//       }
//     },
    
//     async fetchProfile() {
//       this.loading = true
//       try {
//         const response = await userApi.getProfile()
//         this.currentUser = response.data
//         return { success: true, data: response.data }
//       } catch (error) {
//         return { success: false, message: error.message }
//       } finally {
//         this.loading = false
//       }
//     },
    
//     async updateProfile(data) {
//       this.loading = true
//       try {
//         const response = await userApi.updateProfile(data)
//         this.currentUser = response.data
//         return { success: true, data: response.data }
//       } catch (error) {
//         return { success: false, message: error.response?.data || error.message }
//       } finally {
//         this.loading = false
//       }
//     },
    
//     async changePassword(data) {
//       this.loading = true
//       try {
//         await userApi.changePassword(data)
//         return { success: true }
//       } catch (error) {
//         return { success: false, message: error.response?.data || error.message }
//       } finally {
//         this.loading = false
//       }
//     },
    
//     async fetchAllUsers() {
//       this.loading = true
//       try {
//         const response = await userApi.getUsers()
//         this.users = response.data
//         return { success: true, data: response.data }
//       } catch (error) {
//         return { success: false, message: error.message }
//       } finally {
//         this.loading = false
//       }
//     },
    
//     async deleteUser(userId) {
//       this.loading = true
//       try {
//         await userApi.deleteUser(userId)
//         this.users = this.users.filter(u => u.id !== userId)
//         return { success: true }
//       } catch (error) {
//         return { success: false, message: error.message }
//       } finally {
//         this.loading = false
//       }
//     },
    
//     async deleteSelf() {
//       this.loading = true
//       try {
//         await userApi.deleteSelf()
//         return { success: true }
//       } catch (error) {
//         return { success: false, message: error.message }
//       } finally {
//         this.loading = false
//       }
//     }
//   }
// })