// Compila los componentes JSX en bundles pre-transpilados.
// Produce dist/app.js (tienda) y dist/checkout.js (checkout) de forma independiente.
const esbuild = require('esbuild');
const fs = require('fs');

if (!fs.existsSync('dist')) fs.mkdirSync('dist');

const build = (files, outFile) => {
  const combined = files
    .map((f) => `\n/* === ${f} === */\n` + fs.readFileSync(f, 'utf8'))
    .join('\n');

  return esbuild
    .transform(combined, {
      loader: 'jsx',
      jsx: 'transform',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      minify: true,
      legalComments: 'none',
    })
    .then((result) => {
      fs.writeFileSync(outFile, result.code);
      console.log(`✓ ${outFile}  (${(result.code.length / 1024).toFixed(1)} KB)`);
    });
};

Promise.all([
  // Admin — fully pre-compiled with esbuild, no Babel Standalone at runtime.
  // Views first so their window.* globals exist when AdminPanel renders.
  build([
    'admin/views/InventoryView.js',
    'admin/views/OrdersView.js',
    'admin/views/DesignView.js',
    'admin/views/PaymentsView.js',
    'admin/views/DiscountsView.js',
    'admin/views/BannersView.js',
    'admin/views/AnalyticsView.js',
  ], 'dist/admin-views.js'),

  build(['admin/admin-panel.js'], 'dist/admin-panel.js'),

  build([
    'js/firebase-init.js',
    'js/utils.js',
    'js/components/PopupBanner.js',
    'js/components/Home.js',
    'js/components/PaymentGuide.js',
    'js/components/ChatBot.js',
    'js/components/Cart.js',
    'js/App.js',
  ], 'dist/app.js'),

  build([
    'js/utils.js',
    'js/components/ProductDetail.js',
    'js/components/PaymentGuide.js',
    'js/components/ChatBot.js',
    'js/components/Cart.js',
    'js/product-entry.js',
  ], 'dist/product.js'),

  build([
    'js/utils.js',
    'js/components/PaymentModule.js',
    'js/checkout-entry.js',
  ], 'dist/checkout.js'),

  build([
    'js/components/PaymentGuide.js',
    'js/comocomprar-entry.js',
  ], 'dist/comocomprar.js'),

  build([
    'js/components/PrivacyPolicy.js',
    'js/privacidad-entry.js',
  ], 'dist/privacidad.js'),
]).catch((err) => {
  console.error(err);
  process.exit(1);
});
