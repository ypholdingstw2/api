import { defineStore } from 'pinia'
import { orderApi } from '../api/order'

export const useOrderStore = defineStore('order', {
  state: () => ({
    orders: [],
    currentOrder: null,
    loading: false,
  }),
  
  actions: {
    async createOrder(orderData) {
      this.loading = true
      try {
        const response = await orderApi.createOrder(orderData)
        return { success: true, data: response.data }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || error.message }
      } finally {
        this.loading = false
      }
    },
    
    async fetchOrders(params = {}) {
      this.loading = true
      try {
        const response = await orderApi.getOrders(params)
        this.orders = response.data.results || response.data
        return { success: true, data: this.orders }
      } catch (error) {
        return { success: false, message: error.message }
      } finally {
        this.loading = false
      }
    },
    
    async cancelOrder(orderId) {
      this.loading = true
      try {
        const response = await orderApi.cancelOrder(orderId)
        const index = this.orders.findIndex(o => o.id === orderId)
        if (index !== -1) {
          this.orders[index] = response.data.data
        }
        return { success: true, data: response.data }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || error.message }
      } finally {
        this.loading = false
      }
    }
  }
})