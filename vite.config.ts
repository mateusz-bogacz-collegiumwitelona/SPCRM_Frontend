import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const targetApiUrl = env.VITE_API_URL || 'http://localhost:8080';

  return {
    plugins: [tailwindcss(), reactRouter()],
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      proxy: {
        '/api': {
          target: targetApiUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
