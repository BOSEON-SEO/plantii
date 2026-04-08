import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-6xl font-bold text-green-800 mb-4">
            🌱 Plantii
          </h1>
          <p className="text-xl text-green-600">
            디지털 식물 육성 시뮬레이션 플랫폼
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Phase 1 - 프로젝트 초기화 완료
            </h2>
            <p className="text-gray-600 mb-6">
              Plantii 프로젝트가 성공적으로 초기화되었습니다!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-3xl mb-2">🌸</div>
                <h3 className="font-bold text-green-800">15종의 식물</h3>
                <p className="text-sm text-gray-600">실제 데이터 기반</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-3xl mb-2">🌡️</div>
                <h3 className="font-bold text-blue-800">환경 시뮬레이션</h3>
                <p className="text-sm text-gray-600">온도·습도·광량</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-3xl mb-2">📈</div>
                <h3 className="font-bold text-purple-800">성장 시스템</h3>
                <p className="text-sm text-gray-600">단계별 성장</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <button
                onClick={() => setCount((count) => count + 1)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                물 주기 ({count})
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              다음 단계
            </h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>프로젝트 구조 생성 완료</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>백엔드 기본 설정 완료</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>프론트엔드 React + Vite 설정 완료</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">→</span>
                <span>데이터베이스 마이그레이션 실행</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">→</span>
                <span>API 엔드포인트 구현</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">→</span>
                <span>UI 컴포넌트 개발</span>
              </li>
            </ul>
          </div>
        </main>

        <footer className="text-center mt-16 text-gray-600">
          <p>Made with 💚 by Plantii Team</p>
        </footer>
      </div>
    </div>
  )
}

export default App
