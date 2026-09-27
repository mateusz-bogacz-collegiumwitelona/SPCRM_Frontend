import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  // Auth
  index('routes/auth/login.tsx'),
  route('auth/confirm-registration', 'routes/auth/confirm-registration.tsx'),
  route('auth/confirm-email-change', 'routes/auth/confirm-email-change.tsx'),
  route('auth/forgot-password', 'routes/auth/forgot-password.tsx'),
  route('auth/reset-password', 'routes/auth/reset-password.tsx'),

  // Help
  route('help', 'routes/help.tsx'),

  // Dashboards
  route('dashboard', 'routes/dashboard.tsx'),

  // Company
  route('map', 'routes/company/map.tsx'),
  route('company/:clientId', 'routes/company/company-detail.tsx'),
  route('companies', 'routes/company/company-list.tsx'),

  // Contacts
  route('contacts', 'routes/contact/contact-list.tsx'),
  route('contact/:contactId', 'routes/contact/contact-detail.tsx'),

  // Tasks
  route('calendar', 'routes/task/calendar.tsx'),
  route('task/:taskId', 'routes/task/task-detail.tsx'),

  // Sales
  route('sale/:dealId', 'routes/deal/deal-detail.tsx'),
  route('sales', 'routes/deal/deal-list.tsx'),

  // Mailing
  route('mailing', 'routes/mailing-creator.tsx'),

  // Products
  route('products', 'routes/product/product-list.tsx'),
  route('products/:productId', 'routes/product/product-detail.tsx'),

  // Promotions
  route('promotions', 'routes/promotion/promotion-list.tsx'),
  route('promotion/:promotionId', 'routes/promotion/promotion-detail.tsx'),

  // Steel Grades, Currencies, Units of Measure
  route('steel-grades', 'routes/steel-grade/steel-grade-list.tsx'),
  route('currencies', 'routes/currency/currency-list.tsx'),
  route('units', 'routes/units-of-measure/units-of-measure-list.tsx'),

  // Offers
  route('offers', 'routes/offer/offer-list.tsx'),
  route('offer/:offerId', 'routes/offer/offer-detail.tsx'),

  // Users
  route('users', 'routes/user/user-list.tsx'),
  route('user/:userId', 'routes/user/user-detail.tsx'),

  // Invoices
  route('invoices', 'routes/invoice/invoice-list.tsx'),
  route('invoice/:invoiceId', 'routes/invoice/invoice-detail.tsx'),

  // Not Found
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
