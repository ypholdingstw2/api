import api from './index'

export const analysisApi = {
  getIndicators() {
    return api.get('/technical/indicators/')
  },
  getIndicatorDetail(indicatorId) {
    return api.get(`/technical/indicators/${indicatorId}/`)
  },
  runOptimization(indicatorId, params) {
    return api.post(`/technical/optimize/${indicatorId}/`, params)
  }
}