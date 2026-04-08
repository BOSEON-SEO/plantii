import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">👤 프로필</h1>

          <div className="space-y-6">
            {/* User Info */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">사용자 정보</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">사용자명</span>
                  <span className="font-semibold">{user?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">닉네임</span>
                  <span className="font-semibold">
                    {user?.display_name || '설정 안됨'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">이메일</span>
                  <span className="font-semibold">{user?.email}</span>
                </div>
              </div>
            </div>

            {/* Game Stats */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">게임 정보</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{user?.level}</p>
                  <p className="text-sm text-gray-600">레벨</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{user?.coins}</p>
                  <p className="text-sm text-gray-600">코인</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center col-span-2">
                  <p className="text-2xl font-bold text-blue-600">
                    {user?.experience_points}
                  </p>
                  <p className="text-sm text-gray-600">경험치</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button fullWidth variant="secondary">
                설정
              </Button>
              <Button fullWidth variant="danger" onClick={handleLogout}>
                로그아웃
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-gray-600 text-sm">
          <p>Plantii Phase 1 v1.0.0</p>
          <p className="mt-1">Made with 💚 by Plantii Team</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
