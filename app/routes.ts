import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('admin-dashboard', 'routes/admin/dashboard.tsx'),
  route('manager-dashboard', 'routes/manager/dashboard.tsx'),
  route('dashboard', 'routes/user/dashboard.tsx'),
  route('user-sales', 'routes/user/user-sales.tsx'),
  route('help', 'routes/help.tsx'),
  route('map', 'routes/map.tsx'),
  route('contacts', 'routes/contacts.tsx'),
  route('company/:clientId', 'routes/company-details.tsx'),
  route('companies', 'routes/companies.tsx'),
  route('contact/:contactId', 'routes/contact-details.tsx'),
  route('calendar', 'routes/calendar.tsx'),
  route('task/:taskId', 'routes/task-details.tsx'),
  route('sale/:dealId', 'routes/sale-detail.tsx'),
  route('products', 'routes/products.tsx'),
  route('products/:productId', 'routes/product-detail.tsx'),
  route('mailing', 'routes/mailing-creator.tsx'),
  route('promotions', 'routes/promotions.tsx'),
  route('promotion/:promotionId', 'routes/promotion-detail.tsx'),
  route('steel-grades', 'routes/admin/steel-grades.tsx'),
] satisfies RouteConfig;
