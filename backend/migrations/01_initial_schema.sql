-- Plantii Database Initial Schema
-- Version: 1.0
-- Created: 2026-04-08

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: users
-- Description: User account information
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    profile_image_url TEXT,
    experience_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    coins INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT username_length CHECK (char_length(username) >= 3),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT experience_positive CHECK (experience_points >= 0),
    CONSTRAINT level_positive CHECK (level >= 1),
    CONSTRAINT coins_non_negative CHECK (coins >= 0)
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_level ON users(level DESC);

-- =====================================================
-- Table: plants
-- Description: Plant master data catalog
-- =====================================================
CREATE TABLE plants (
    id VARCHAR(50) PRIMARY KEY,
    name_ko VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_scientific VARCHAR(200),
    category VARCHAR(20) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    description TEXT,
    icon_url TEXT,

    -- Environment data (stored as JSONB)
    environment JSONB NOT NULL,

    -- Growth data
    growth JSONB NOT NULL,

    -- Stress factors
    stress_factors JSONB,

    -- Rewards information
    rewards JSONB NOT NULL,

    -- Metadata
    is_unlocked_by_default BOOLEAN DEFAULT TRUE,
    unlock_level INTEGER DEFAULT 1,
    unlock_cost INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT category_check CHECK (category IN ('flowering', 'succulent', 'herb', 'foliage', 'vegetable')),
    CONSTRAINT difficulty_check CHECK (difficulty IN ('easy', 'medium', 'hard'))
);

CREATE INDEX idx_plants_category ON plants(category);
CREATE INDEX idx_plants_difficulty ON plants(difficulty);
CREATE INDEX idx_plants_unlock_level ON plants(unlock_level);

-- JSONB indexes for better query performance
CREATE INDEX idx_plants_environment_gin ON plants USING GIN (environment);
CREATE INDEX idx_plants_growth_gin ON plants USING GIN (growth);

-- =====================================================
-- Table: plant_variants
-- Description: Plant variant data (Phase 2+)
-- =====================================================
CREATE TABLE plant_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plant_id VARCHAR(50) REFERENCES plants(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL,

    -- Variant-specific characteristics (overrides parent data)
    environment_overrides JSONB,
    growth_overrides JSONB,

    -- Visual characteristics
    color_primary VARCHAR(7),
    color_secondary VARCHAR(7),
    icon_url TEXT,

    -- Rarity
    rarity VARCHAR(20) DEFAULT 'common',
    unlock_condition JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT rarity_check CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary'))
);

CREATE INDEX idx_plant_variants_plant_id ON plant_variants(plant_id);
CREATE INDEX idx_plant_variants_rarity ON plant_variants(rarity);

-- =====================================================
-- Table: user_plants
-- Description: User's planted plant instances
-- =====================================================
CREATE TABLE user_plants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plant_id VARCHAR(50) NOT NULL REFERENCES plants(id),
    variant_id UUID REFERENCES plant_variants(id),

    -- Plant basic information
    nickname VARCHAR(100),
    planted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Current state
    current_stage VARCHAR(50) NOT NULL DEFAULT 'seed',
    current_age_days DECIMAL(10, 2) DEFAULT 0,
    health DECIMAL(5, 2) DEFAULT 100.00,
    growth_progress DECIMAL(5, 2) DEFAULT 0.00,

    -- Environment state (latest values cached)
    temperature DECIMAL(5, 2),
    humidity DECIMAL(5, 2),
    light_dli DECIMAL(5, 2),
    soil_moisture DECIMAL(5, 2),
    last_watered_at TIMESTAMP WITH TIME ZONE,

    -- Simulation state
    is_active BOOLEAN DEFAULT TRUE,
    is_wilted BOOLEAN DEFAULT FALSE,
    is_harvestable BOOLEAN DEFAULT FALSE,
    harvested_at TIMESTAMP WITH TIME ZONE,

    -- Statistics
    total_water_given INTEGER DEFAULT 0,
    total_environment_adjustments INTEGER DEFAULT 0,
    optimal_days_count INTEGER DEFAULT 0,

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT health_range CHECK (health >= 0 AND health <= 100),
    CONSTRAINT growth_progress_range CHECK (growth_progress >= 0 AND growth_progress <= 100),
    CONSTRAINT age_non_negative CHECK (current_age_days >= 0)
);

CREATE INDEX idx_user_plants_user_id ON user_plants(user_id);
CREATE INDEX idx_user_plants_plant_id ON user_plants(plant_id);
CREATE INDEX idx_user_plants_planted_at ON user_plants(planted_at DESC);
CREATE INDEX idx_user_plants_is_active ON user_plants(is_active);
CREATE INDEX idx_user_plants_current_stage ON user_plants(current_stage);
CREATE INDEX idx_user_plants_is_harvestable ON user_plants(is_harvestable);

-- =====================================================
-- Table: plant_states
-- Description: Plant state history (time-series data)
-- =====================================================
CREATE TABLE plant_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_plant_id UUID NOT NULL REFERENCES user_plants(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Environment data
    temperature DECIMAL(5, 2),
    humidity DECIMAL(5, 2),
    light_dli DECIMAL(5, 2),
    soil_moisture DECIMAL(5, 2),

    -- Plant state
    health DECIMAL(5, 2) NOT NULL,
    growth_rate DECIMAL(5, 3) NOT NULL DEFAULT 1.000,
    stage VARCHAR(50) NOT NULL,
    age_days DECIMAL(10, 2) NOT NULL,

    -- Calculated metrics
    stress_level DECIMAL(5, 2) DEFAULT 0,
    environment_score DECIMAL(5, 2),

    -- Events (watering, harvest, etc.)
    event_type VARCHAR(50),
    event_data JSONB,

    CONSTRAINT health_range CHECK (health >= 0 AND health <= 100),
    CONSTRAINT stress_range CHECK (stress_level >= 0 AND stress_level <= 100),
    CONSTRAINT growth_rate_positive CHECK (growth_rate >= 0)
);

CREATE INDEX idx_plant_states_user_plant_id ON plant_states(user_plant_id);
CREATE INDEX idx_plant_states_timestamp ON plant_states(timestamp DESC);
CREATE INDEX idx_plant_states_event_type ON plant_states(event_type);

-- Composite index for time-series queries
CREATE INDEX idx_plant_states_composite ON plant_states(user_plant_id, timestamp DESC);

-- =====================================================
-- Table: growth_stages
-- Description: Growth stage master data
-- =====================================================
CREATE TABLE growth_stages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name_ko VARCHAR(100),
    display_name_en VARCHAR(100),
    description TEXT,
    icon_url TEXT,
    order_index INTEGER NOT NULL,

    CONSTRAINT unique_order CHECK (order_index >= 0)
);

CREATE UNIQUE INDEX idx_growth_stages_order ON growth_stages(order_index);

-- Insert default growth stages
INSERT INTO growth_stages (name, display_name_ko, display_name_en, order_index) VALUES
('seed', '씨앗', 'Seed', 0),
('sprout', '발아', 'Sprout', 1),
('seedling', '묘목', 'Seedling', 2),
('vegetative', '성장기', 'Vegetative', 3),
('flowering', '개화기', 'Flowering', 4),
('fruiting', '결실기', 'Fruiting', 5),
('mature', '성숙', 'Mature', 6),
('harvestable', '수확 가능', 'Harvestable', 7);

-- =====================================================
-- Table: achievements
-- Description: Achievement definitions
-- =====================================================
CREATE TABLE achievements (
    id VARCHAR(50) PRIMARY KEY,
    name_ko VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    category VARCHAR(50),
    condition JSONB NOT NULL,
    reward_experience INTEGER DEFAULT 0,
    reward_coins INTEGER DEFAULT 0,
    is_secret BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_achievements_category ON achievements(category);

-- =====================================================
-- Table: user_achievements
-- Description: User's unlocked achievements
-- =====================================================
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL REFERENCES achievements(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    progress JSONB,

    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC);

-- =====================================================
-- Table: user_settings
-- Description: User preferences and settings
-- =====================================================
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    -- Game settings
    time_scale DECIMAL(3, 1) DEFAULT 1.0,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,

    -- Display settings
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'ko',

    -- Personalization
    preferences JSONB,

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT time_scale_range CHECK (time_scale >= 0.1 AND time_scale <= 10.0),
    CONSTRAINT theme_check CHECK (theme IN ('light', 'dark', 'auto'))
);

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plants_updated_at
    BEFORE UPDATE ON plants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_plants_updated_at
    BEFORE UPDATE ON user_plants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Views
-- =====================================================

-- View: Active user plants with plant information
CREATE VIEW v_active_user_plants AS
SELECT
    up.id,
    up.user_id,
    up.plant_id,
    p.name_ko,
    p.name_en,
    p.category,
    p.difficulty,
    up.nickname,
    up.current_stage,
    up.current_age_days,
    up.health,
    up.growth_progress,
    up.is_harvestable,
    up.planted_at,
    up.temperature,
    up.humidity,
    up.light_dli,
    up.soil_moisture,
    up.last_watered_at,

    -- Optimal environment conditions
    p.environment->'temperature'->>'optimal_min' AS temp_min,
    p.environment->'temperature'->>'optimal_max' AS temp_max,
    p.environment->'humidity'->>'optimal_min' AS humidity_min,
    p.environment->'humidity'->>'optimal_max' AS humidity_max

FROM user_plants up
JOIN plants p ON up.plant_id = p.id
WHERE up.is_active = TRUE;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE users IS 'User account information';
COMMENT ON TABLE plants IS 'Plant master data catalog with 15 species';
COMMENT ON TABLE plant_variants IS 'Plant variant data for diversity (Phase 2+)';
COMMENT ON TABLE user_plants IS 'User''s planted plant instances';
COMMENT ON TABLE plant_states IS 'Plant state history for time-series analysis';
COMMENT ON TABLE growth_stages IS 'Growth stage definitions';
COMMENT ON TABLE achievements IS 'Achievement system definitions';
COMMENT ON TABLE user_achievements IS 'User''s unlocked achievements';
COMMENT ON TABLE user_settings IS 'User preferences and game settings';

-- =====================================================
-- Initial Data (Sample)
-- =====================================================

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO plantii;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO plantii;

-- End of migration
