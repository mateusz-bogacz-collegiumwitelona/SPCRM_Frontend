import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('admin-dashboard', 'routes/admin/dashboard.tsx'),
  route('manager-dashboard', 'routes/manager/dashboard.tsx'),
  route('dashboard', 'routes/user/dashboard.tsx'),
  route('help', 'routes/help.tsx'),
] satisfies RouteConfig;
