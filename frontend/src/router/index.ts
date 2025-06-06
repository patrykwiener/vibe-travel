import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { createErrorNavigationGuard } from './navigation-guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      // Lazy-loaded component
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/UserProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/notes',
      name: 'notes',
      component: () => import('../views/NotesListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/notes/new',
      name: 'create-note',
      component: () => import('../views/NoteCreateView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/notes/:noteId',
      name: 'note-detail',
      component: () => import('../views/NoteDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/notes/:noteId/edit',
      name: 'edit-note',
      component: () => import('../views/NoteEditView.vue'),
      meta: { requiresAuth: true },
    },
    {
      // Catch-all route for 404 pages
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

// Navigation Guard with Error Handling
router.beforeEach(createErrorNavigationGuard())

export default router
