// Compila los componentes JSX (js/) en un solo bundle pre-transpilado.
// Elimina la necesidad de Babel Standalone en el navegador.
const esbuild = require('esbuild');
const fs = require('fs');

// El orden importa: cada archivo registra componentes en window.* que los
// siguientes consumen como globales (mismo patrón que tenían los <script>).
const files = [
  'js/utils.js',
  'js/components/PopupBanner.js',
  'js/components/Home.js',
  'js/components/ProductDetail.js',
  'js/components/Cart.js',
  'js/components/OrderConfirmModal.js',
  'js/App.js',
];

const combined = files
  .map((f) => `\n/* === ${f} === */\n` + fs.readFileSync(f, 'utf8'))
  .join('\n');

esbuild
  .transform(combined, {
    loader: 'jsx',
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    minify: true,
    legalComments: 'none',
  })
  .then((result) => {
    if (!fs.existsSync('dist')) fs.mkdirSync('dist');
    fs.writeFileSync('dist/app.js', result.code);
    console.log(`✓ dist/app.js  (${(result.code.length / 1024).toFixed(1)} KB)`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
