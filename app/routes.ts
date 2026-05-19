import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('admin-dashboard', 'routes/admin/dashboard.tsx'),
  route('manager-dashboard', 'routes/manager/dashboard.tsx'),
  route('dashboard', 'routes/user/dashboard.tsx'),
  route('user-sales', 'routes/user-sales.tsx'),
  route('help', 'routes/help.tsx'),
  route('map', 'routes/map.tsx'),
] satisfies RouteConfig;
