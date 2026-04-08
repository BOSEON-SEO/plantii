import React, { useState, useEffect } from 'react';
import { plantService, UserPlant } from '../services/plant.service';
import ProgressBar from '../components/ProgressBar';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [currentPlant, setCurrentPlant] = useState<UserPlant | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPlants();
  }, []);

  const loadPlants = async () => {
    try {
      const data = await plantService.getUserPlants();
      if (data.length > 0) {
        setCurrentPlant(data[0]);
      }
    } catch (error) {
      console.error('Failed to load plants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWater = async () => {
    if (!currentPlant) return;
    setActionLoading(true);
    setMessage('');

    try {
      const result = await plantService.waterPlant(currentPlant.id);
      setMessage(result.message || '물을 주었습니다!');
      await loadPlants();
    } catch (error: any) {
      setMessage(error.error?.message || '물주기에 실패했습니다');
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSunlight = async () => {
    if (!currentPlant) return;
    setActionLoading(true);
    setMessage('');

    try {
      const newLightDli = Math.min((currentPlant.light_dli || 0) + 5, 30);
      const result = await plantService.adjustEnvironment(currentPlant.id, {
        light_dli: newLightDli,
      });
      setMessage(result.message || '햇빛을 조사했습니다!');
      await loadPlants();
    } catch (error: any) {
      setMessage(error.error?.message || '햇빛 조사에 실패했습니다');
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleHarvest = async () => {
    if (!currentPlant || !currentPlant.is_harvestable) return;
    if (!window.confirm('식물을 수확하시겠습니까?')) return;

    setActionLoading(true);
    setMessage('');

    try {
      const result = await plantService.harvestPlant(currentPlant.id);
      setMessage(`수확 완료! 경험치 ${result.rewards.total_experience}와 코인 ${result.rewards.total_coins}를 획득했습니다!`);
      await loadPlants();
    } catch (error: any) {
      setMessage(error.error?.message || '수확에 실패했습니다');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">🌱</div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!currentPlant) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🌱</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              아직 식물이 없습니다
            </h2>
            <p className="text-gray-600 mb-6">
              첫 번째 식물을 심어보세요!
            </p>
            <Button onClick={() => window.location.href = '/collection'}>
              도감 보기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const stageEmojis: { [key: string]: string } = {
    seed: '🌰',
    sprout: '🌱',
    seedling: '🌿',
    vegetative: '🪴',
    flowering: '🌸',
    fruiting: '🍎',
    mature: '🌳',
    harvestable: '✨',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* User Info */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {user?.display_name || user?.username}
              </h2>
              <p className="text-sm text-gray-600">
                레벨 {user?.level} • 💰 {user?.coins} 코인
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">경험치</p>
              <p className="text-lg font-semibold text-green-600">
                {user?.experience_points} XP
              </p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}

        {/* Main Plant Display */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-6">
            <div className="text-8xl mb-4">
              {stageEmojis[currentPlant.current_stage] || '🌱'}
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {currentPlant.nickname || '내 식물'}
            </h1>
            <div className="flex items-center justify-center gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                {currentPlant.current_stage}
              </span>
              <span className="text-gray-600">
                {currentPlant.current_age_days.toFixed(1)}일차
              </span>
            </div>
          </div>

          {/* Status Gauges */}
          <div className="space-y-4 mb-6">
            <ProgressBar
              label="건강도"
              value={currentPlant.health}
              color={currentPlant.health >= 70 ? 'green' : currentPlant.health >= 40 ? 'yellow' : 'red'}
            />
            <ProgressBar
              label="성장 진행도"
              value={currentPlant.growth_progress}
              color="blue"
            />
            <ProgressBar
              label="토양 수분"
              value={currentPlant.soil_moisture || 0}
              color={currentPlant.soil_moisture && currentPlant.soil_moisture >= 60 ? 'blue' : 'yellow'}
            />
          </div>

          {/* Environment Info */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600">온도</p>
              <p className="text-xl font-semibold text-gray-800">
                {currentPlant.temperature?.toFixed(1) || '--'}°C
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">습도</p>
              <p className="text-xl font-semibold text-gray-800">
                {currentPlant.humidity?.toFixed(0) || '--'}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">광량</p>
              <p className="text-xl font-semibold text-gray-800">
                {currentPlant.light_dli?.toFixed(1) || '--'} DLI
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleWater}
              disabled={actionLoading}
              loading={actionLoading}
            >
              💧 물 주기
            </Button>
            <Button
              onClick={handleSunlight}
              disabled={actionLoading}
              variant="secondary"
            >
              ☀️ 햇빛
            </Button>
          </div>

          {currentPlant.is_harvestable && (
            <div className="mt-4">
              <Button
                onClick={handleHarvest}
                disabled={actionLoading}
                fullWidth
                variant="primary"
              >
                ✨ 수확하기
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
