// frontend/src/api/user.js

import api from './index'

export const userApi = {
  // 註冊
  register(data) {
    return api.post('/users/', data)
  },
  
  // 取得我的個人資料
  getProfile() {
    return api.get('/users/me/')
  },
  
  // 更新我的個人資料
  updateProfile(data) {
    return api.patch('/users/me/', data)
  },
  
  // 修改密碼
  changePassword(data) {
    return api.post('/users/change-password/', data)
  },
  
  // 取得所有使用者（需管理員）
  getUsers(params) {
    return api.get('/users/', { params })
  },
  
  // 取得特定使用者
  getUser(id) {
    return api.get(`/users/${id}/`)
  },
  
  // 更新特定使用者（需管理員）
  updateUser(id, data) {
    return api.patch(`/users/${id}/`, data)
  },
  
  // 刪除使用者（需管理員）
  deleteUser(id) {
    return api.delete(`/users/${id}/`)
  },
  
  // 刪除自己
  deleteSelf() {
    return api.delete('/users/me/')
  }
}