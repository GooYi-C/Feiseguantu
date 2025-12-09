import { createMemoryHistory, createRouter, RouteRecordRaw } from 'vue-router';

// 懒加载页面组件
const Dashboard = () => import('./views/Dashboard.vue');
const Profile = () => import('./views/Profile.vue');
const Characters = () => import('./views/Characters.vue');
const Relations = () => import('./views/Relations.vue');
const Romance = () => import('./views/Romance.vue');
const Faction = () => import('./views/Faction.vue');
const Assets = () => import('./views/Assets.vue');
const Secrets = () => import('./views/Secrets.vue');
const Opportunities = () => import('./views/Opportunities.vue');
const Variables = () => import('./views/Variables.vue');

// 路由配置 - 按逻辑分类与信息量密度排序
// 注：scene 路由已移除，其内容将合并到 Dashboard
// 注：variables 移至末尾（高级用户功能）
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard,
    meta: { title: '仪表盘', icon: 'fa-gauge-high', theme: 'default' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: Profile,
    meta: { title: '个人档案', icon: 'fa-id-card', theme: 'profile' },
  },
  {
    path: '/characters',
    name: 'characters',
    component: Characters,
    meta: { title: '人物库', icon: 'fa-users', theme: 'characters' },
  },
  {
    path: '/relations',
    name: 'relations',
    component: Relations,
    meta: { title: '关系网', icon: 'fa-diagram-project', theme: 'relations' },
  },
  {
    path: '/romance',
    name: 'romance',
    component: Romance,
    meta: { title: '绯色互动', icon: 'fa-heart', theme: 'romance' },
  },
  {
    path: '/faction',
    name: 'faction',
    component: Faction,
    meta: { title: '派系图谱', icon: 'fa-sitemap', theme: 'faction' },
  },
  {
    path: '/assets',
    name: 'assets',
    component: Assets,
    meta: { title: '个人资产', icon: 'fa-coins', theme: 'assets' },
  },
  {
    path: '/secrets',
    name: 'secrets',
    component: Secrets,
    meta: { title: '暗账', icon: 'fa-user-secret', theme: 'secrets' },
  },
  {
    path: '/opportunities',
    name: 'opportunities',
    component: Opportunities,
    meta: { title: '机遇与危机', icon: 'fa-scale-balanced', theme: 'opportunities' },
  },
  // 全量变量移至末尾（高级功能）
  {
    path: '/variables',
    name: 'variables',
    component: Variables,
    meta: { title: '全量变量', icon: 'fa-database', theme: 'variables' },
  },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

export default router;
