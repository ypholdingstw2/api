import api from './index'

export const orderApi = {
  createOrder(data) {
    return api.post('/orders/', data)
  },
  
  getOrders(params = {}) {
    return api.get('/orders/', { params })
  },
  
  getOrder(id) {
    return api.get(`/orders/${id}/`)
  },
  
  cancelOrder(id) {
    return api.post(`/orders/${id}/cancel/`)
  },
  
  getMyOrders(params = {}) {
    return api.get('/orders/my_orders/', { params })
  }
}