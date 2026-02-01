// vue.config.js - ES module version
import { defineConfig } from '@vue/cli-service'

export default defineConfig({
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})