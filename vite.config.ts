import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 백엔드 4개 모듈이 각자 다른 로컬 포트로 뜬다(팀원마다 포트가 다를 수 있음).
// 포트는 커밋되는 vite.config.ts가 아니라 .env.local(각자 로컬, 미커밋)에서 읽는다 — .env.example 참고.
// 기본값을 두지 않는다: .env.local을 안 만들었다면 값이 비어 조용히 잘못된 곳으로 프록시되는 대신
// 바로 에러가 나는 쪽이 낫다.
type ApiModule = 'visitor' | 'expo-admin' | 'platform-admin' | 'exhibitor'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const proxyFor = (apiModule: ApiModule, port: string) => ({
    target: `http://localhost:${port}`,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(new RegExp(`^/proxy/${apiModule}`), ''),
  })

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/proxy/visitor': proxyFor('visitor', env.VITE_API_VISITOR_PORT),
        '/proxy/expo-admin': proxyFor('expo-admin', env.VITE_API_EXPO_ADMIN_PORT),
        '/proxy/platform-admin': proxyFor('platform-admin', env.VITE_API_PLATFORM_ADMIN_PORT),
        '/proxy/exhibitor': proxyFor('exhibitor', env.VITE_API_EXHIBITOR_PORT),
      },
    },
  }
})
