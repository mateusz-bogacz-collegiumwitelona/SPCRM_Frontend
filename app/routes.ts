import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  // Login, Auth and Help
  index('routes/home.tsx'), // Login page
  route('sales', 'routes/deals.tsx'),
  route('help', 'routes/help.tsx'),
  route('auth/confirm-registration', 'routes/auth/confirm-registration.tsx'),
  route('auth/confirm-email-change', 'routes/auth/confirm-email-change.tsx'),
  route('auth/forgot-password', 'routes/auth/forgot-password.tsx'),
  route('auth/reset-password', 'routes/auth/reset-password.tsx'),

  // Dashboards
  route('dashboard', 'routes/dashboard.tsx'),

  // Company
  route('map', 'routes/map.tsx'),
  route('company/:clientId', 'routes/company-details.tsx'),
  route('companies', 'routes/companies.tsx'),

  // Contacts
  route('contacts', 'routes/contacts.tsx'),
  route('contact/:contactId', 'routes/contact-details.tsx'),

  // Tasks
  route('calendar', 'routes/calendar.tsx'),
  route('task/:taskId', 'routes/task-details.tsx'),

  // Sales
  route('sale/:dealId', 'routes/deal-detail.tsx'),

  // Mailing
  route('mailing', 'routes/mailing-creator.tsx'),

  // Products
  route('products', 'routes/products.tsx'),
  route('products/:productId', 'routes/product-detail.tsx'),

  // Promotions
  route('promotions', 'routes/promotions.tsx'),
  route('promotion/:promotionId', 'routes/promotion-detail.tsx'),

  // Steel Grades, Currencies, Units of Measure
  route('steel-grades', 'routes/admin/steel-grades.tsx'),
  route('currencies', 'routes/admin/currencies.tsx'),
  route('units', 'routes/admin/units-of-mesure.tsx'),

  // Offers
  route('offers', 'routes/offers.tsx'),
  route('offer/:offerId', 'routes/offer-detail.tsx'),

  // Users
  route('users', 'routes/users.tsx'),
  route('user/:userId', 'routes/user-detail.tsx'),

  // Invoices
  route('invoices', 'routes/invoices.tsx'),
  route('invoice/:invoiceId', 'routes/invoice-detail.tsx'),

  // Not Found
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
