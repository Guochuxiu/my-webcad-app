import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import ElementPlus from '@fscut/element-plus';
import '@fscut/element-plus/dist/index.css';
import BochUI from '@fscut/bochui';
import '@fscut/bochui/lib/style.css';

createApp(App).use(router).use(BochUI).use(ElementPlus).mount('#app');
