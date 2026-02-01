// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';

const routes = [
  // Public routes
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { public: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { public: true, guestOnly: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { public: true, guestOnly: true },
  },
  {
    path: '/faculty',
    name: 'FacultyList',
    component: () => import('@/views/faculty/FacultyListView.vue'),
    meta: { public: true }, // Anonymous access as per requirements
  },
  
  // Protected routes
  {
    path: '/proposals',
    name: 'Proposals',
    component: () => import('@/views/proposals/ProposalListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/proposals/create',
    name: 'CreateProposal',
    component: () => import('@/views/proposals/CreateProposalView.vue'),
    meta: { requiresAuth: true, facultyOnly: true },
  },
  {
    path: '/proposals/:id',
    name: 'ProposalDetail',
    component: () => import('@/views/proposals/ProposalDetailView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  
  // 404 route
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const isAuthenticated = store.state.auth.isAuthenticated;
  const userType = store.state.auth.user?.type;
  
  // Check if route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
    return;
  }
  
  // Check if route is guest-only (login/register when already logged in)
  if (to.meta.guestOnly && isAuthenticated) {
    next({ name: 'Proposals' });
    return;
  }
  
  // Check faculty-only routes
  if (to.meta.facultyOnly && userType !== 'FACULTY') {
    next({ name: 'Proposals' });
    return;
  }
  
  // Check student-only routes
  if (to.meta.studentOnly && userType !== 'STUDENT') {
    next({ name: 'Proposals' });
    return;
  }
  
  // Check admin-only routes
  if (to.meta.adminOnly && userType !== 'ADMIN') {
    next({ name: 'Proposals' });
    return;
  }
  
  next();
});

export default router;