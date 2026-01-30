/*import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')*/

// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import axios from 'axios';

// Import CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './assets/scss/main.scss';

// Set axios defaults
axios.defaults.baseURL = process.env.VUE_APP_API_BASE_URL;

// Create Vue app
const app = createApp(App);

// Use plugins
app.use(store);
app.use(router);

// Global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue error:', err, info);
  // You could send this to an error tracking service
};

// Mount app
app.mount('#app');