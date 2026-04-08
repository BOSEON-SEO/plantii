import React, { useState, useEffect } from 'react';
import { plantService, Plant, UserPlant } from '../services/plant.service';
import Button from '../components/Button';

const Collection: React.FC = () => {
  const [allPlants, setAllPlants] = useState<Plant[]>([]);
  const [userPlants, setUserPlants] = useState<UserPlant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plants, myPlants] = await Promise.all([
        plantService.getAllPlants(),
        plantService.getUserPlants(),
      ]);
      setAllPlants(plants);
      setUserPlants(myPlants);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryNames: { [key: string]: string } = {
    flowering: '🌸 화훼류',
    succulent: '🌵 다육/선인장',
    herb: '🌿 허브',
    foliage: '🪴 관엽식물',
    vegetable: '🥬 채소류',
  };

  const difficultyColors: { [key: string]: string } = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  };

  const difficultyNames: { [key: string]: string } = {
    easy: '쉬움',
    medium: '보통',
    hard: '어려움',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  // Group plants by category
  const groupedPlants = allPlants.reduce((acc, plant) => {
    if (!acc[plant.category]) {
      acc[plant.category] = [];
    }
    acc[plant.category].push(plant);
    return acc;
  }, {} as { [key: string]: Plant[] });

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🌱 식물 도감</h1>
          <p className="text-gray-600">
            총 {allPlants.length}종 • 보유 {userPlants.length}개
          </p>
        </div>

        {/* My Plants */}
        {userPlants.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">내 식물</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {userPlants.map((plant) => (
                <div
                  key={plant.id}
                  className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-200"
                >
                  <div className="text-4xl text-center mb-2">🌱</div>
                  <h3 className="font-semibold text-center text-gray-800 mb-1">
                    {plant.nickname || plant.plant_id}
                  </h3>
                  <div className="text-center">
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                      {plant.current_stage}
                    </span>
                  </div>
                  <div className="mt-2 text-center text-sm text-gray-600">
                    {plant.current_age_days.toFixed(0)}일차
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${plant.health}%` }}
                      />
                    </div>
                    <p className="text-xs text-center text-gray-600 mt-1">
                      건강도 {Math.round(plant.health)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Plants by Category */}
        {Object.entries(groupedPlants).map(([category, plants]) => (
          <div key={category} className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {categoryNames[category] || category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plants.map((plant) => (
                <div
                  key={plant.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-800">{plant.name_ko}</h3>
                      <p className="text-sm text-gray-500 italic">{plant.name_en}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${difficultyColors[plant.difficulty]}`}
                    >
                      {difficultyNames[plant.difficulty]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">수확:</span>{' '}
                      {plant.growth.harvest_days_min}~{plant.growth.harvest_days_max}일
                    </div>
                    <div>
                      <span className="font-medium">보상:</span>{' '}
                      {plant.rewards.coins} 코인
                    </div>
                  </div>

                  <Button size="sm" fullWidth variant="secondary">
                    심기
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Collection;
