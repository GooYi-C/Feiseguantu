import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './app.vue';
import router from './router';
import './styles/variables.scss';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

$(() => {
  app.mount('#app');
  console.info('[绯色官途] 前端界面加载成功');
});

$(window).on('pagehide', () => {
  app.unmount();
  console.info('[绯色官途] 前端界面已卸载');
});
