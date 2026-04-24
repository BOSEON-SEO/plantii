# Plantii Phase 2 - Milestone: Garden Management & Economy System

> **Version**: 1.0
> **Date**: 2026-04-24
> **Status**: Planning
> **Depends on**: Phase 1 (Core plant simulation, auth, basic CRUD)

---

## Table of Contents

1. [Current Architecture Summary](#1-current-architecture-summary)
2. [Milestone Overview & Dependency Graph](#2-milestone-overview--dependency-graph)
3. [Module 1: Multi-Plot Garden Grid System](#3-module-1-multi-plot-garden-grid-system)
4. [Module 2: Shop System](#4-module-2-shop-system)
5. [Module 3: Tool Upgrade System](#5-module-3-tool-upgrade-system)
6. [Module 4: Resource Management System](#6-module-4-resource-management-system)
7. [Module 5: Coin Economy & Spending Loop](#7-module-5-coin-economy--spending-loop)
8. [Implementation Order & Phase Plan](#8-implementation-order--phase-plan)
9. [Database Migration Strategy](#9-database-migration-strategy)
10. [Risk & Open Questions](#10-risk--open-questions)

---

## 1. Current Architecture Summary

### 1.1 Existing Backend Structure (Node.js + Express + TypeScript + PostgreSQL/Knex)

```
backend/src/
  config/        database.ts, knexfile.ts
  controllers/   auth.controller.ts, plant.controller.ts, userPlant.controller.ts
  models/        User.ts, Plant.ts, UserPlant.ts
  services/      auth.service.ts, plant.service.ts, userPlant.service.ts, simulation.service.ts
  routes/        index.ts, auth.routes.ts, plant.routes.ts, userPlant.routes.ts
  jobs/          simulationCron.ts
  middleware/    auth.ts, errorHandler.ts
  utils/         encryption.ts, logger.ts, response.ts, validation.ts
```

### 1.2 Existing Frontend Structure (React 18 + TypeScript + Vite + Tailwind)

```
frontend/src/
  components/    Button.tsx, Layout.tsx, PrivateRoute.tsx, ProgressBar.tsx
  contexts/      AuthContext.tsx
  pages/         Dashboard.tsx, Collection.tsx, Login.tsx, Register.tsx, Profile.tsx
  services/      api.ts, auth.service.ts, plant.service.ts
  styles/        index.css
```

### 1.3 Existing Data Models (Key Fields)

| Model      | Key Fields |
|------------|-----------|
| `users`    | id(UUID), username, email, password_hash, experience_points, level, coins(default 1000) |
| `plants`   | id(VARCHAR), name_ko/en, category, difficulty, environment(JSONB), growth(JSONB), rewards(JSONB), unlock_level, unlock_cost |
| `user_plants` | id(UUID), user_id, plant_id, nickname, current_stage, health, growth_progress, temperature, humidity, light_dli, soil_moisture, is_harvestable |

### 1.4 Existing API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/auth/register | Registration |
| POST | /api/v1/auth/login | Login |
| GET | /api/v1/plants | List all plants |
| GET | /api/v1/plants/:id | Get plant detail |
| POST | /api/v1/user-plants | Plant a seed (single slot) |
| GET | /api/v1/user-plants | List user's plants |
| GET | /api/v1/user-plants/:id | Get user plant detail |
| PATCH | /api/v1/user-plants/:id | Update user plant |
| DELETE | /api/v1/user-plants/:id | Remove user plant |
| POST | /api/v1/user-plants/:id/water | Water plant |
| POST | /api/v1/user-plants/:id/environment | Adjust environment |
| POST | /api/v1/user-plants/:id/harvest | Harvest plant |

### 1.5 Key Observations for Expansion

- **Single-plant focus**: Dashboard loads `data[0]` - no multi-plot concept.
- **No shop/inventory**: Users can plant any unlocked plant freely.
- **No resource constraints**: Water is unlimited, no tools exist.
- **Coin exists but barely used**: `users.coins` default 1000, earned on harvest, but no spending mechanism (except `cost_coins: 10` in adjustEnvironment response, which is not actually deducted).
- **No grid/position**: `user_plants` has no spatial position data.

---

## 2. Milestone Overview & Dependency Graph

### 2.1 Module Dependency DAG

```
                    [M5: Coin Economy]
                    /       |        \
                   /        |         \
    [M2: Shop System]  [M3: Tool Upgrades]  [M4: Resource Mgmt]
          |                 |                      |
          |_________________|______________________|
                            |
                   [M1: Garden Grid System]
                            |
                   [Existing Phase 1 Code]
```

**Critical Path**: M1 -> M4 -> M2 -> M3 -> M5

### 2.2 Implementation Order (Recommended)

| Phase | Module | Reason |
|-------|--------|--------|
| Phase 2.1 | M1: Garden Grid | Foundation - all other modules need plot positions |
| Phase 2.2 | M5: Coin Economy (Core) | Must define economy constants before shop |
| Phase 2.3 | M4: Resource Management | Water tank / fertilizer are prerequisites for tools & shop |
| Phase 2.4 | M2: Shop System | Depends on economy + resources + grid |
| Phase 2.5 | M3: Tool Upgrades | Depends on shop (purchase) + resources (consumption) |

---

## 3. Module 1: Multi-Plot Garden Grid System

### 3.1 Overview

Transform the single-plant Dashboard into a spatial grid where users manage multiple plots simultaneously. Each plot is a tile that can hold one plant, one pot, and one decoration.

### 3.2 Data Structures

#### 3.2.1 New Table: `garden_grids`

```sql
CREATE TABLE garden_grids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) DEFAULT 'My Garden',
    grid_rows INTEGER NOT NULL DEFAULT 3,
    grid_cols INTEGER NOT NULL DEFAULT 3,
    max_plots INTEGER NOT NULL DEFAULT 9,
    unlocked_plots INTEGER NOT NULL DEFAULT 4,
    theme VARCHAR(50) DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT one_garden_per_user UNIQUE(user_id),
    CONSTRAINT grid_size CHECK (grid_rows >= 1 AND grid_rows <= 10),
    CONSTRAINT grid_cols_check CHECK (grid_cols >= 1 AND grid_cols <= 10),
    CONSTRAINT plots_check CHECK (unlocked_plots >= 1 AND unlocked_plots <= max_plots)
);
```

#### 3.2.2 New Table: `garden_plots`

```sql
CREATE TABLE garden_plots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    garden_id UUID NOT NULL REFERENCES garden_grids(id) ON DELETE CASCADE,
    user_plant_id UUID REFERENCES user_plants(id) ON DELETE SET NULL,

    -- Position in grid (0-indexed)
    row_index INTEGER NOT NULL,
    col_index INTEGER NOT NULL,

    -- Plot state
    is_unlocked BOOLEAN DEFAULT FALSE,
    is_empty BOOLEAN DEFAULT TRUE,

    -- Modifiers (from pots, soil, decorations)
    pot_item_id UUID,             -- FK to user_inventory (added in M2)
    decoration_item_id UUID,       -- FK to user_inventory (added in M2)
    soil_type VARCHAR(50) DEFAULT 'normal',

    -- Bonuses applied to this plot
    growth_bonus DECIMAL(4,2) DEFAULT 0.00,   -- percentage bonus
    health_bonus DECIMAL(4,2) DEFAULT 0.00,
    water_retention_bonus DECIMAL(4,2) DEFAULT 0.00,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_plot_position UNIQUE(garden_id, row_index, col_index),
    CONSTRAINT valid_row CHECK (row_index >= 0),
    CONSTRAINT valid_col CHECK (col_index >= 0)
);
```

#### 3.2.3 Modify Existing: `user_plants` (add column)

```sql
ALTER TABLE user_plants ADD COLUMN plot_id UUID REFERENCES garden_plots(id) ON DELETE SET NULL;
CREATE INDEX idx_user_plants_plot_id ON user_plants(plot_id);
```

#### 3.2.4 TypeScript Interfaces

```typescript
// backend/src/models/GardenGrid.ts
export interface GardenGrid {
  id: string;
  user_id: string;
  name: string;
  grid_rows: number;
  grid_cols: number;
  max_plots: number;
  unlocked_plots: number;
  theme: string;
  created_at: Date;
  updated_at: Date;
}

// backend/src/models/GardenPlot.ts
export interface GardenPlot {
  id: string;
  garden_id: string;
  user_plant_id: string | null;
  row_index: number;
  col_index: number;
  is_unlocked: boolean;
  is_empty: boolean;
  pot_item_id: string | null;
  decoration_item_id: string | null;
  soil_type: string;
  growth_bonus: number;
  health_bonus: number;
  water_retention_bonus: number;
  created_at: Date;
  updated_at: Date;
}
```

### 3.3 API Design

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| GET | /api/v1/garden | Get user's garden grid with all plots | - | `{ garden: GardenGrid, plots: GardenPlot[] }` |
| POST | /api/v1/garden | Initialize garden (auto on first login) | `{ name? }` | `{ garden, plots }` |
| POST | /api/v1/garden/plots/:plotId/plant | Plant a seed in a specific plot | `{ plant_id, nickname? }` | `{ plot, user_plant }` |
| DELETE | /api/v1/garden/plots/:plotId/plant | Remove plant from plot | - | `{ plot }` |
| POST | /api/v1/garden/plots/:plotId/unlock | Unlock a locked plot | - | `{ plot, cost_coins }` |
| PATCH | /api/v1/garden/plots/:plotId | Update plot (pot, decoration, soil) | `{ pot_item_id?, decoration_item_id?, soil_type? }` | `{ plot }` |
| GET | /api/v1/garden/plots/:plotId | Get plot detail with plant status | - | `{ plot, user_plant?, plant_data? }` |

### 3.4 Business Rules

1. **Initial Garden**: 3x3 grid, 4 plots unlocked (center + adjacent), 5 locked.
2. **Plot Unlock Cost**: Scaling formula: `base_cost * (1.5 ^ (unlocked_count - 4))`
   - Plot 5: 500 coins, Plot 6: 750, Plot 7: 1125, Plot 8: 1687, Plot 9: 2531
3. **Garden Expansion**: Future phase - expand beyond 3x3 to 4x4, 5x5 etc.
4. **Adjacency Bonus**: Adjacent plots with same-category plants get +5% growth bonus.

### 3.5 Frontend Components

```
frontend/src/
  pages/
    Garden.tsx              -- Main garden view (replaces Dashboard as home)
  components/
    garden/
      GardenGrid.tsx        -- Grid layout container
      GardenPlot.tsx        -- Individual plot tile (plant display, empty state, locked state)
      PlotDetailModal.tsx   -- Detail modal when clicking a plot
      PlantSelectorModal.tsx -- Choose which seed to plant
```

### 3.6 Implementation Tasks

- [ ] Create `GardenGrid` and `GardenPlot` models
- [ ] Write migration `02_garden_grid.sql`
- [ ] Create `garden.service.ts` with grid init, plot unlock, plant placement
- [ ] Create `garden.controller.ts` and `garden.routes.ts`
- [ ] Update `userPlant.service.ts` to accept `plot_id`
- [ ] Build `GardenGrid.tsx`, `GardenPlot.tsx` components
- [ ] Build `Garden.tsx` page, update `App.tsx` routing
- [ ] Add auto-init garden on user registration
- [ ] Add plot unlock with coin deduction

---

## 4. Module 2: Shop System

### 4.1 Overview

A shop where users spend coins to buy seeds, fertilizers, pots, tools, and decorations. Items go into user inventory and are consumed/equipped from there.

### 4.2 Data Structures

#### 4.2.1 New Table: `shop_items`

```sql
CREATE TABLE shop_items (
    id VARCHAR(50) PRIMARY KEY,
    name_ko VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,

    -- Classification
    category VARCHAR(30) NOT NULL,      -- 'seed', 'fertilizer', 'pot', 'tool', 'decoration'
    sub_category VARCHAR(50),            -- e.g., 'organic_fertilizer', 'ceramic_pot'
    rarity VARCHAR(20) DEFAULT 'common', -- 'common','uncommon','rare','epic','legendary'

    -- Pricing
    price_coins INTEGER NOT NULL,
    price_premium INTEGER DEFAULT 0,     -- future premium currency

    -- Item behavior
    is_consumable BOOLEAN DEFAULT FALSE,  -- true for seeds, fertilizer
    is_stackable BOOLEAN DEFAULT TRUE,
    max_stack INTEGER DEFAULT 99,
    is_equippable BOOLEAN DEFAULT FALSE,  -- true for pots, tools

    -- Effect data
    effects JSONB,
    /*
      Examples:
      Seed: { "plant_id": "rose", "quantity": 1 }
      Fertilizer: { "growth_bonus": 0.20, "duration_hours": 24 }
      Pot: { "health_bonus": 5, "water_retention_bonus": 10 }
      Tool: { "type": "watering_can", "level": 1, "capacity": 5 }
      Decoration: { "adjacency_bonus": 0.05, "theme": "zen" }
    */

    -- Unlock conditions
    required_level INTEGER DEFAULT 1,
    is_available BOOLEAN DEFAULT TRUE,
    available_from TIMESTAMP WITH TIME ZONE,
    available_until TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT category_check CHECK (category IN ('seed','fertilizer','pot','tool','decoration')),
    CONSTRAINT rarity_check CHECK (rarity IN ('common','uncommon','rare','epic','legendary')),
    CONSTRAINT price_positive CHECK (price_coins >= 0)
);

CREATE INDEX idx_shop_items_category ON shop_items(category);
CREATE INDEX idx_shop_items_rarity ON shop_items(rarity);
CREATE INDEX idx_shop_items_required_level ON shop_items(required_level);
```

#### 4.2.2 New Table: `user_inventory`

```sql
CREATE TABLE user_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id VARCHAR(50) NOT NULL REFERENCES shop_items(id),

    quantity INTEGER NOT NULL DEFAULT 1,

    -- For equipped items
    is_equipped BOOLEAN DEFAULT FALSE,
    equipped_at_plot_id UUID REFERENCES garden_plots(id) ON DELETE SET NULL,

    -- For active consumables (e.g., fertilizer in effect)
    is_active BOOLEAN DEFAULT FALSE,
    active_until TIMESTAMP WITH TIME ZONE,
    active_on_plant_id UUID REFERENCES user_plants(id) ON DELETE SET NULL,

    -- Metadata
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT quantity_positive CHECK (quantity >= 0)
);

CREATE INDEX idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX idx_user_inventory_item_id ON user_inventory(item_id);
CREATE INDEX idx_user_inventory_equipped ON user_inventory(is_equipped) WHERE is_equipped = TRUE;
```

#### 4.2.3 New Table: `transactions`

```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(30) NOT NULL, -- 'purchase','sale','reward','unlock','upgrade'

    -- What was transacted
    item_id VARCHAR(50) REFERENCES shop_items(id),
    quantity INTEGER DEFAULT 1,

    -- Money flow
    coins_spent INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,

    -- Context
    description TEXT,
    metadata JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT type_check CHECK (transaction_type IN ('purchase','sale','reward','unlock','upgrade'))
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
```

#### 4.2.4 TypeScript Interfaces

```typescript
// backend/src/models/ShopItem.ts
export interface ShopItem {
  id: string;
  name_ko: string;
  name_en: string;
  description: string | null;
  icon_url: string | null;
  category: 'seed' | 'fertilizer' | 'pot' | 'tool' | 'decoration';
  sub_category: string | null;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  price_coins: number;
  price_premium: number;
  is_consumable: boolean;
  is_stackable: boolean;
  max_stack: number;
  is_equippable: boolean;
  effects: Record<string, any>;
  required_level: number;
  is_available: boolean;
}

// backend/src/models/UserInventory.ts
export interface UserInventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  is_equipped: boolean;
  equipped_at_plot_id: string | null;
  is_active: boolean;
  active_until: Date | null;
  active_on_plant_id: string | null;
  acquired_at: Date;
}

// backend/src/models/Transaction.ts
export interface Transaction {
  id: string;
  user_id: string;
  transaction_type: 'purchase' | 'sale' | 'reward' | 'unlock' | 'upgrade';
  item_id: string | null;
  quantity: number;
  coins_spent: number;
  coins_earned: number;
  description: string | null;
  metadata: Record<string, any> | null;
  created_at: Date;
}
```

### 4.3 API Design

| Method | Path | Description | Request Body |
|--------|------|-------------|-------------|
| GET | /api/v1/shop | List shop items (with filters) | query: `?category=seed&rarity=common` |
| GET | /api/v1/shop/:itemId | Get shop item detail | - |
| POST | /api/v1/shop/purchase | Buy an item | `{ item_id, quantity }` |
| POST | /api/v1/shop/sell | Sell inventory item back (50% price) | `{ inventory_id, quantity }` |
| GET | /api/v1/inventory | List user's inventory | query: `?category=seed` |
| POST | /api/v1/inventory/:id/use | Use a consumable item | `{ target_plant_id? }` |
| POST | /api/v1/inventory/:id/equip | Equip item to plot | `{ plot_id }` |
| POST | /api/v1/inventory/:id/unequip | Unequip item from plot | - |
| GET | /api/v1/transactions | Transaction history | query: `?type=purchase&limit=50` |

### 4.4 Business Rules

1. **Purchase Flow**: Check level requirement -> Check stock -> Deduct coins -> Create inventory entry -> Log transaction.
2. **Seed Purchase**: Seeds are consumable. Buying a rose seed gives 1 inventory item of type `seed_rose`. Planting consumes it.
3. **Fertilizer**: Consumable, applied to a specific plant. Sets `active_until` and `active_on_plant_id`. SimulationService reads active fertilizers.
4. **Pots**: Equippable to a garden plot. One pot per plot. Provides bonuses (health, water retention).
5. **Decorations**: Equippable to a garden plot. One decoration per plot. Adjacency bonuses.
6. **Sell-back**: 50% of purchase price, rounded down.
7. **Level-gating**: Items require minimum user level to purchase.

### 4.5 Shop Item Catalog (Initial Seed Data)

```typescript
const SHOP_ITEMS_SEED_DATA = [
  // === SEEDS (one per plant species) ===
  { id: 'seed_lettuce', category: 'seed', price_coins: 50, effects: { plant_id: 'lettuce' }, required_level: 1 },
  { id: 'seed_basil', category: 'seed', price_coins: 60, effects: { plant_id: 'basil' }, required_level: 1 },
  { id: 'seed_mint', category: 'seed', price_coins: 60, effects: { plant_id: 'mint' }, required_level: 1 },
  { id: 'seed_cactus', category: 'seed', price_coins: 80, effects: { plant_id: 'cactus' }, required_level: 1 },
  { id: 'seed_succulent', category: 'seed', price_coins: 80, effects: { plant_id: 'succulent' }, required_level: 2 },
  { id: 'seed_aloe', category: 'seed', price_coins: 100, effects: { plant_id: 'aloe' }, required_level: 2 },
  { id: 'seed_tomato', category: 'seed', price_coins: 100, effects: { plant_id: 'tomato' }, required_level: 3 },
  { id: 'seed_chili', category: 'seed', price_coins: 120, effects: { plant_id: 'chili' }, required_level: 3 },
  { id: 'seed_sunflower', category: 'seed', price_coins: 150, effects: { plant_id: 'sunflower' }, required_level: 4 },
  { id: 'seed_tulip', category: 'seed', price_coins: 150, effects: { plant_id: 'tulip' }, required_level: 4 },
  { id: 'seed_lavender', category: 'seed', price_coins: 180, effects: { plant_id: 'lavender' }, required_level: 5 },
  { id: 'seed_rose', category: 'seed', price_coins: 200, effects: { plant_id: 'rose' }, required_level: 6 },
  { id: 'seed_rubber_plant', category: 'seed', price_coins: 200, effects: { plant_id: 'rubber_plant' }, required_level: 6 },
  { id: 'seed_monstera', category: 'seed', price_coins: 250, effects: { plant_id: 'monstera' }, required_level: 7 },
  { id: 'seed_orchid', category: 'seed', price_coins: 300, effects: { plant_id: 'orchid' }, required_level: 8 },

  // === FERTILIZERS ===
  { id: 'fert_basic', category: 'fertilizer', price_coins: 30, rarity: 'common',
    effects: { growth_bonus: 0.10, duration_hours: 12 }, required_level: 1 },
  { id: 'fert_organic', category: 'fertilizer', price_coins: 80, rarity: 'uncommon',
    effects: { growth_bonus: 0.20, health_bonus: 5, duration_hours: 24 }, required_level: 3 },
  { id: 'fert_premium', category: 'fertilizer', price_coins: 200, rarity: 'rare',
    effects: { growth_bonus: 0.35, health_bonus: 10, duration_hours: 48 }, required_level: 6 },
  { id: 'fert_miracle', category: 'fertilizer', price_coins: 500, rarity: 'epic',
    effects: { growth_bonus: 0.50, health_bonus: 15, duration_hours: 72 }, required_level: 9 },

  // === POTS ===
  { id: 'pot_clay', category: 'pot', price_coins: 100, rarity: 'common',
    effects: { water_retention_bonus: 5 }, required_level: 1 },
  { id: 'pot_ceramic', category: 'pot', price_coins: 250, rarity: 'uncommon',
    effects: { water_retention_bonus: 10, health_bonus: 3 }, required_level: 3 },
  { id: 'pot_terracotta', category: 'pot', price_coins: 400, rarity: 'rare',
    effects: { water_retention_bonus: 15, health_bonus: 5, growth_bonus: 0.05 }, required_level: 5 },
  { id: 'pot_designer', category: 'pot', price_coins: 800, rarity: 'epic',
    effects: { water_retention_bonus: 20, health_bonus: 8, growth_bonus: 0.10 }, required_level: 8 },

  // === TOOLS (see Module 3 for details) ===
  { id: 'tool_watering_can_lv1', category: 'tool', price_coins: 0, rarity: 'common',
    effects: { type: 'watering_can', level: 1, capacity: 3, efficiency: 1.0 }, required_level: 1 },
  { id: 'tool_watering_can_lv2', category: 'tool', price_coins: 500, rarity: 'uncommon',
    effects: { type: 'watering_can', level: 2, capacity: 5, efficiency: 1.2 }, required_level: 3 },
  { id: 'tool_watering_can_lv3', category: 'tool', price_coins: 1500, rarity: 'rare',
    effects: { type: 'watering_can', level: 3, capacity: 8, efficiency: 1.5 }, required_level: 6 },

  // === DECORATIONS ===
  { id: 'deco_garden_gnome', category: 'decoration', price_coins: 150, rarity: 'common',
    effects: { adjacency_bonus: 0.03 }, required_level: 2 },
  { id: 'deco_wind_chime', category: 'decoration', price_coins: 300, rarity: 'uncommon',
    effects: { adjacency_bonus: 0.05, theme: 'zen' }, required_level: 4 },
  { id: 'deco_fairy_lights', category: 'decoration', price_coins: 500, rarity: 'rare',
    effects: { adjacency_bonus: 0.08, light_bonus: 2 }, required_level: 6 },
  { id: 'deco_fountain', category: 'decoration', price_coins: 1000, rarity: 'epic',
    effects: { adjacency_bonus: 0.10, water_retention_bonus: 5 }, required_level: 8 },
];
```

### 4.6 Frontend Components

```
frontend/src/
  pages/
    Shop.tsx                 -- Main shop page with category tabs
  components/
    shop/
      ShopItemCard.tsx       -- Item card in shop grid
      ShopCategoryTabs.tsx   -- Category filter tabs
      PurchaseModal.tsx      -- Confirm purchase dialog
      InventoryPanel.tsx     -- User's inventory sidebar/page
      InventoryItemCard.tsx  -- Item in inventory
  services/
    shop.service.ts          -- Shop & inventory API calls
```

### 4.7 Implementation Tasks

- [ ] Create `ShopItem`, `UserInventory`, `Transaction` models
- [ ] Write migration `03_shop_system.sql`
- [ ] Create `shop.service.ts` (purchase, sell, list)
- [ ] Create `inventory.service.ts` (list, use, equip/unequip)
- [ ] Create `transaction.service.ts` (log, query)
- [ ] Create controllers and routes for shop, inventory, transactions
- [ ] Integrate seed consumption into garden planting flow
- [ ] Integrate fertilizer activation into simulation engine
- [ ] Integrate pot/decoration bonuses into `GardenPlot` bonuses
- [ ] Build Shop.tsx, InventoryPanel.tsx, and related frontend components
- [ ] Populate seed data in migration

---

## 5. Module 3: Tool Upgrade System

### 5.1 Overview

Tools are persistent, non-consumable items that improve gameplay efficiency. They are purchased and upgraded through the shop. Tools affect resource usage and automation.

### 5.2 Tool Types

| Tool | Level 1 (Free) | Level 2 (500c) | Level 3 (1500c) | Level 4 (4000c) | Level 5 (10000c) |
|------|----------------|----------------|-----------------|-----------------|-----------------|
| **Watering Can** | 3 uses/fill, 1x efficiency | 5 uses/fill, 1.2x | 8 uses/fill, 1.5x | 12 uses/fill, 1.8x | Unlimited, 2.0x |
| **Greenhouse** | - (locked) | 1 plot protected | 2 plots protected | 4 plots protected | All plots, +10% growth |
| **Sprinkler** | - (locked) | Auto-water 1 plot/6h | 2 plots/4h | 4 plots/2h | All plots/1h |

### 5.3 Data Structures

#### 5.3.1 New Table: `user_tools`

```sql
CREATE TABLE user_tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tool_type VARCHAR(50) NOT NULL,      -- 'watering_can', 'greenhouse', 'sprinkler'
    current_level INTEGER NOT NULL DEFAULT 1,
    max_level INTEGER NOT NULL DEFAULT 5,

    -- Tool-specific state
    current_uses INTEGER DEFAULT 0,       -- for watering can: remaining uses
    max_uses INTEGER DEFAULT 3,
    last_refill_at TIMESTAMP WITH TIME ZONE,
    auto_refill_interval_hours INTEGER,   -- null = no auto-refill

    -- For greenhouse & sprinkler: which plots are assigned
    assigned_plot_ids UUID[] DEFAULT '{}',

    -- Upgrade tracking
    total_coins_invested INTEGER DEFAULT 0,
    upgraded_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_user_tool UNIQUE(user_id, tool_type),
    CONSTRAINT level_range CHECK (current_level >= 1 AND current_level <= max_level),
    CONSTRAINT uses_non_negative CHECK (current_uses >= 0)
);

CREATE INDEX idx_user_tools_user_id ON user_tools(user_id);
CREATE INDEX idx_user_tools_type ON user_tools(tool_type);
```

#### 5.3.2 Tool Config (Static Constants)

```typescript
// backend/src/config/tools.config.ts
export const TOOL_CONFIG = {
  watering_can: {
    levels: [
      { level: 1, upgrade_cost: 0,     max_uses: 3,  efficiency: 1.0, refill_hours: 6 },
      { level: 2, upgrade_cost: 500,   max_uses: 5,  efficiency: 1.2, refill_hours: 4 },
      { level: 3, upgrade_cost: 1500,  max_uses: 8,  efficiency: 1.5, refill_hours: 3 },
      { level: 4, upgrade_cost: 4000,  max_uses: 12, efficiency: 1.8, refill_hours: 2 },
      { level: 5, upgrade_cost: 10000, max_uses: -1, efficiency: 2.0, refill_hours: 0 }, // unlimited
    ],
  },
  greenhouse: {
    unlock_level: 3,    // user level required to purchase
    unlock_cost: 800,
    levels: [
      { level: 1, upgrade_cost: 800,  protected_plots: 1, growth_bonus: 0.0 },
      { level: 2, upgrade_cost: 2000, protected_plots: 2, growth_bonus: 0.0 },
      { level: 3, upgrade_cost: 5000, protected_plots: 4, growth_bonus: 0.05 },
      { level: 4, upgrade_cost: 10000, protected_plots: 6, growth_bonus: 0.08 },
      { level: 5, upgrade_cost: 20000, protected_plots: -1, growth_bonus: 0.10 }, // all plots
    ],
    // Protected plots are immune to temperature stress outside tolerance range
    effect: 'Reduces temperature stress. Protected plots treat temperature as clamped within tolerance range.',
  },
  sprinkler: {
    unlock_level: 5,
    unlock_cost: 1200,
    levels: [
      { level: 1, upgrade_cost: 1200, auto_plots: 1, interval_hours: 6 },
      { level: 2, upgrade_cost: 3000, auto_plots: 2, interval_hours: 4 },
      { level: 3, upgrade_cost: 7000, auto_plots: 4, interval_hours: 2 },
      { level: 4, upgrade_cost: 15000, auto_plots: 6, interval_hours: 1 },
      { level: 5, upgrade_cost: 30000, auto_plots: -1, interval_hours: 1 }, // all plots, every hour
    ],
    // Sprinkler auto-waters assigned plots by consuming water from water tank
    effect: 'Automatically waters assigned plots at intervals. Consumes water from water tank.',
  },
};
```

#### 5.3.3 TypeScript Interface

```typescript
export interface UserTool {
  id: string;
  user_id: string;
  tool_type: 'watering_can' | 'greenhouse' | 'sprinkler';
  current_level: number;
  max_level: number;
  current_uses: number;
  max_uses: number;
  last_refill_at: Date | null;
  auto_refill_interval_hours: number | null;
  assigned_plot_ids: string[];
  total_coins_invested: number;
  upgraded_at: Date | null;
}
```

### 5.4 API Design

| Method | Path | Description | Request Body |
|--------|------|-------------|-------------|
| GET | /api/v1/tools | Get all user tools | - |
| GET | /api/v1/tools/:toolType | Get specific tool detail | - |
| POST | /api/v1/tools/:toolType/upgrade | Upgrade tool to next level | - |
| POST | /api/v1/tools/:toolType/refill | Manually refill (watering can) | - |
| POST | /api/v1/tools/:toolType/assign | Assign plots to tool | `{ plot_ids: string[] }` |
| POST | /api/v1/tools/:toolType/unassign | Remove plot from tool | `{ plot_id }` |

### 5.5 Integration with Simulation

```typescript
// In simulation.service.ts - enhanced calculateGrowthRate:
calculateGrowthRate(environment, plantEnvironment, baseRate, plotBonuses, toolBonuses) {
  // ... existing factor calculations ...

  // Apply greenhouse protection
  if (toolBonuses.greenhouse_protected) {
    // Clamp temperature within tolerance range
    effectiveTemp = Math.max(tolerance_min, Math.min(tolerance_max, effectiveTemp));
  }

  // Apply greenhouse growth bonus
  const greenhouseBonus = toolBonuses.greenhouse_growth_bonus || 0;

  // Apply fertilizer bonus (from active inventory items)
  const fertilizerBonus = plotBonuses.active_fertilizer_bonus || 0;

  // Apply pot bonus
  const potBonus = plotBonuses.growth_bonus || 0;

  const totalBonus = 1 + greenhouseBonus + fertilizerBonus + potBonus;
  const growthRate = baseRate * tempFactor * humidityFactor * lightFactor * waterFactor * totalBonus;

  return Math.max(0, Math.min(3, growthRate));
}
```

### 5.6 Sprinkler Cron Job

```typescript
// backend/src/jobs/sprinklerCron.ts
// Runs every 30 minutes, checks all sprinklers with auto_plots > 0
// For each assigned plot, if interval has elapsed:
//   1. Check water tank has enough water
//   2. Deduct water from tank
//   3. Water the plant (same as manual water, with sprinkler efficiency)
//   4. Log event in plant_states
```

### 5.7 Frontend Components

```
frontend/src/
  components/
    tools/
      ToolPanel.tsx          -- Tool management panel (in garden view sidebar)
      ToolCard.tsx           -- Individual tool display with upgrade button
      ToolUpgradeModal.tsx   -- Upgrade confirmation with cost/benefit preview
      ToolAssignModal.tsx    -- Assign plots to greenhouse/sprinkler
```

### 5.8 Implementation Tasks

- [ ] Create `UserTool` model and migration `04_tool_system.sql`
- [ ] Create `tools.config.ts` with static level definitions
- [ ] Create `tool.service.ts` (init, upgrade, refill, assign)
- [ ] Create `tool.controller.ts` and `tool.routes.ts`
- [ ] Integrate watering can uses into water action (deduct use, check remaining)
- [ ] Integrate greenhouse protection into simulation engine
- [ ] Create `sprinklerCron.ts` job for auto-watering
- [ ] Build frontend tool components
- [ ] Auto-create watering_can lv1 on user registration

---

## 6. Module 4: Resource Management System

### 6.1 Overview

Introduce finite resource pools (water tank, fertilizer stock) that constrain actions and create strategic decisions. Resources must be replenished through time or purchase.

### 6.2 Data Structures

#### 6.2.1 New Table: `user_resources`

```sql
CREATE TABLE user_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Water Tank
    water_current INTEGER NOT NULL DEFAULT 20,
    water_max INTEGER NOT NULL DEFAULT 20,
    water_regen_rate DECIMAL(5,2) DEFAULT 1.00,    -- units per hour (natural rain)
    water_last_regen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Fertilizer Stock
    fertilizer_basic_count INTEGER DEFAULT 0,
    fertilizer_organic_count INTEGER DEFAULT 0,
    fertilizer_premium_count INTEGER DEFAULT 0,
    fertilizer_miracle_count INTEGER DEFAULT 0,

    -- Energy (future: limits daily actions)
    energy_current INTEGER DEFAULT 100,
    energy_max INTEGER DEFAULT 100,
    energy_regen_rate DECIMAL(5,2) DEFAULT 10.00,   -- per hour
    energy_last_regen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT one_resource_per_user UNIQUE(user_id),
    CONSTRAINT water_range CHECK (water_current >= 0 AND water_current <= water_max),
    CONSTRAINT energy_range CHECK (energy_current >= 0 AND energy_current <= energy_max)
);
```

#### 6.2.2 Water Tank Upgrade Config

```typescript
// backend/src/config/resources.config.ts
export const WATER_TANK_CONFIG = {
  levels: [
    { level: 1, capacity: 20,  regen_rate: 1.0,  upgrade_cost: 0 },
    { level: 2, capacity: 35,  regen_rate: 1.5,  upgrade_cost: 300 },
    { level: 3, capacity: 50,  regen_rate: 2.0,  upgrade_cost: 800 },
    { level: 4, capacity: 75,  regen_rate: 3.0,  upgrade_cost: 2000 },
    { level: 5, capacity: 100, regen_rate: 5.0,  upgrade_cost: 5000 },
  ],
  // Water cost per action:
  water_per_plant: 2,                  // base cost to water one plant
  water_per_plant_with_sprinkler: 1,   // sprinkler is more efficient
};

export const RESOURCE_COSTS = {
  water_per_manual_watering: 2,     // manual water action
  water_per_sprinkler_cycle: 1,     // auto sprinkler per plant
  energy_per_watering: 5,
  energy_per_harvest: 10,
  energy_per_environment_adjust: 3,
};
```

#### 6.2.3 TypeScript Interface

```typescript
export interface UserResources {
  id: string;
  user_id: string;
  water_current: number;
  water_max: number;
  water_regen_rate: number;
  water_last_regen_at: Date;
  fertilizer_basic_count: number;
  fertilizer_organic_count: number;
  fertilizer_premium_count: number;
  fertilizer_miracle_count: number;
  energy_current: number;
  energy_max: number;
  energy_regen_rate: number;
  energy_last_regen_at: Date;
}
```

### 6.3 API Design

| Method | Path | Description | Request Body |
|--------|------|-------------|-------------|
| GET | /api/v1/resources | Get user's resource status (with regen calc) | - |
| POST | /api/v1/resources/water/refill | Purchase water refill with coins | `{ amount? }` |
| POST | /api/v1/resources/water/upgrade | Upgrade water tank | - |
| POST | /api/v1/resources/energy/refill | Purchase energy refill | - |

### 6.4 Resource Regeneration Logic

```typescript
// resource.service.ts
calculateCurrentWater(resources: UserResources): number {
  const now = new Date();
  const lastRegen = new Date(resources.water_last_regen_at);
  const elapsedHours = (now.getTime() - lastRegen.getTime()) / (1000 * 60 * 60);

  const regenerated = Math.floor(elapsedHours * resources.water_regen_rate);
  const current = Math.min(resources.water_max, resources.water_current + regenerated);

  return current;
}

// Called before every water action:
async consumeWater(userId: string, amount: number): Promise<boolean> {
  const resources = await this.getResources(userId);
  const currentWater = this.calculateCurrentWater(resources);

  if (currentWater < amount) {
    throw new AppError('INSUFFICIENT_WATER', 'Not enough water in tank', 400);
  }

  await this.updateWater(userId, currentWater - amount);
  return true;
}
```

### 6.5 Integration Points

1. **Water action** (`POST /user-plants/:id/water`): Deduct from water tank, deduct watering can use.
2. **Sprinkler cron**: Deduct from water tank per auto-watered plant.
3. **Fertilizer use**: Deduct from fertilizer stock (or inventory).
4. **Shop purchase of fertilizer**: Increment fertilizer stock count.
5. **Water tank refill**: Available in shop or via coins.

### 6.6 Frontend Components

```
frontend/src/
  components/
    resources/
      ResourceBar.tsx        -- Horizontal bar showing water/energy with regen timer
      WaterTankWidget.tsx     -- Water tank display with refill/upgrade buttons
      ResourcePanel.tsx       -- Combined resource overview panel
```

### 6.7 Implementation Tasks

- [ ] Create `UserResources` model and migration `05_resource_system.sql`
- [ ] Create `resources.config.ts`
- [ ] Create `resource.service.ts` (get, consume, refill, upgrade, regen calc)
- [ ] Create `resource.controller.ts` and `resource.routes.ts`
- [ ] Integrate water consumption into watering flow
- [ ] Integrate water consumption into sprinkler cron
- [ ] Integrate fertilizer stock into inventory/use flow
- [ ] Auto-create resources row on user registration
- [ ] Build ResourceBar, WaterTankWidget components
- [ ] Add resource display to Garden.tsx

---

## 7. Module 5: Coin Economy & Spending Loop

### 7.1 Overview

Design a balanced coin economy that creates a compelling gameplay loop: **Earn -> Spend -> Grow -> Earn More**. This module defines earning rates, spending sinks, and balance tuning.

### 7.2 Economy Flow Diagram

```
    [EARNING]                              [SPENDING]
    =========                              ==========
    Harvest rewards ----+             +--> Buy seeds
    Daily login bonus --+             +--> Buy fertilizer
    Achievement rewards-+---[COINS]---+--> Buy/upgrade pots
    Sell items ---------+             +--> Buy/upgrade tools
    Quest completion ---+             +--> Buy decorations
                                      +--> Unlock plots
                                      +--> Upgrade water tank
                                      +--> Refill water
                                      +--> Upgrade tools
                                                |
                                                v
                                      [BETTER GROWTH]
                                                |
                                                v
                                      [MORE HARVESTS]
                                                |
                                                v
                                         [MORE COINS]
```

### 7.3 Earning Sources (Detailed)

| Source | Base Amount | Bonus Condition | Frequency |
|--------|------------|----------------|-----------|
| Harvest (easy plant) | 100 coins | +50% if >70% optimal days | Per harvest |
| Harvest (medium plant) | 200 coins | +50% if >70% optimal days | Per harvest |
| Harvest (hard plant) | 350 coins | +50% if >70% optimal days | Per harvest |
| Daily login | 50 coins | +10/day streak (max 200) | Daily |
| First harvest of species | 100 coins bonus | One-time per species | One-time |
| Achievement unlock | 50~500 coins | Varies by achievement | One-time |
| Sell item | 50% of buy price | - | Anytime |

### 7.4 Spending Sinks (Detailed)

| Sink | Cost Range | Purpose |
|------|-----------|---------|
| Seeds | 50~300 coins | Core loop |
| Fertilizer | 30~500 coins | Growth acceleration |
| Pots | 100~800 coins | Passive bonuses |
| Decorations | 150~1000 coins | Aesthetic + adjacency bonuses |
| Plot unlock | 500~2531 coins | Expand garden |
| Tool upgrades | 500~30000 coins | Automation |
| Water tank upgrades | 300~5000 coins | Resource capacity |
| Water refill | 20 coins/5 units | Emergency resource |

### 7.5 Balance Analysis

```
--- Early Game (Level 1-3, first 3 days) ---
Starting coins: 1000
Earn rate: ~100-200 coins/harvest, 2 harvests/day avg = 200-400/day
Spend rate: Seeds (50-80) + Fertilizer (30) + Plot unlock (500) = ~600
Net: Player can sustain basic loop, plot unlock is a meaningful goal

--- Mid Game (Level 4-6, day 4-14) ---
Earn rate: ~300-500 coins/harvest (medium plants + bonuses), 3-4/day = 1000-2000/day
Spend rate: Seeds (100-200) + Fertilizer (80) + Pots (250-400) + Tool upgrades = ~1000-2000/day
Net: Balanced. Tool upgrades become the big goal.

--- Late Game (Level 7+, day 15+) ---
Earn rate: ~500-700 coins/harvest (hard plants + all bonuses), 5-6/day = 3000-4000/day
Spend rate: Premium tools (4000-30000), Rare items, Full garden decoration
Net: Saving for large upgrades provides long-term goals
```

### 7.6 Data Structures

#### 7.6.1 Modify Existing: `users` (add daily login tracking)

```sql
ALTER TABLE users ADD COLUMN daily_login_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_daily_reward_at DATE;
```

#### 7.6.2 New Table: `economy_config` (admin tuning)

```sql
CREATE TABLE economy_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed data
INSERT INTO economy_config (key, value, description) VALUES
('harvest_base_coins', '{"easy": 100, "medium": 200, "hard": 350}', 'Base coin reward per difficulty'),
('harvest_optimal_bonus', '{"threshold": 0.7, "multiplier": 1.5}', 'Bonus for optimal care'),
('daily_login', '{"base": 50, "streak_bonus": 10, "max_streak_bonus": 200}', 'Daily login rewards'),
('sell_ratio', '{"default": 0.5}', 'Sell-back price ratio'),
('water_refill_cost', '{"per_5_units": 20}', 'Emergency water refill cost'),
('plot_unlock_base', '{"base_cost": 500, "scaling_factor": 1.5}', 'Plot unlock scaling');
```

#### 7.6.3 Economy Constants (Code)

```typescript
// backend/src/config/economy.config.ts
export const ECONOMY = {
  // Starting resources
  INITIAL_COINS: 1000,
  INITIAL_WATER: 20,

  // Harvest rewards
  HARVEST_COINS: {
    easy: 100,
    medium: 200,
    hard: 350,
  },
  HARVEST_EXP: {
    easy: 50,
    medium: 100,
    hard: 200,
  },
  HARVEST_OPTIMAL_BONUS: {
    threshold: 0.70,      // 70% optimal days
    multiplier: 1.50,     // 50% bonus
  },

  // Daily login
  DAILY_LOGIN: {
    base_coins: 50,
    streak_bonus_per_day: 10,
    max_streak_bonus: 200,
    max_streak_days: 30,
  },

  // First harvest bonus
  FIRST_HARVEST_BONUS: 100,

  // Sell-back ratio
  SELL_RATIO: 0.50,

  // Water refill
  WATER_REFILL: {
    coins_per_5_units: 20,
    max_refill_per_day: 10,  // 50 units max buy per day
  },

  // Experience per level (cumulative)
  LEVEL_THRESHOLDS: [
    0,      // Level 1
    100,    // Level 2
    300,    // Level 3
    600,    // Level 4
    1000,   // Level 5
    1500,   // Level 6
    2200,   // Level 7
    3000,   // Level 8
    4000,   // Level 9
    5500,   // Level 10
  ],

  // Plot unlock costs
  PLOT_UNLOCK: {
    base_cost: 500,
    scaling_factor: 1.5,
    initial_unlocked: 4,
  },
};
```

### 7.7 API Design

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/economy/daily-reward | Claim daily login reward |
| GET | /api/v1/economy/balance | Get coin balance + earning summary |
| GET | /api/v1/economy/leaderboard | Coin/level leaderboard |

### 7.8 Service: Coin Transaction Wrapper

```typescript
// backend/src/services/economy.service.ts
export const EconomyService = {
  async spendCoins(userId: string, amount: number, reason: string, metadata?: any): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user || user.coins < amount) {
      throw new AppError('INSUFFICIENT_COINS', `Need ${amount} coins, have ${user?.coins || 0}`, 400);
    }

    await db.transaction(async (trx) => {
      await trx('users').where({ id: userId }).decrement('coins', amount);
      await trx('transactions').insert({
        user_id: userId,
        transaction_type: reason,
        coins_spent: amount,
        description: `Spent ${amount} coins: ${reason}`,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });
    });
  },

  async earnCoins(userId: string, amount: number, reason: string, metadata?: any): Promise<void> {
    await db.transaction(async (trx) => {
      await trx('users').where({ id: userId }).increment('coins', amount);
      await trx('transactions').insert({
        user_id: userId,
        transaction_type: reason,
        coins_earned: amount,
        description: `Earned ${amount} coins: ${reason}`,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });
    });
  },

  async claimDailyReward(userId: string): Promise<{ coins: number; streak: number }> {
    const user = await UserModel.findById(userId);
    if (!user) throw new AppError('USER_NOT_FOUND', 'User not found', 404);

    const today = new Date().toISOString().split('T')[0];
    if (user.last_daily_reward_at === today) {
      throw new AppError('ALREADY_CLAIMED', 'Daily reward already claimed today', 400);
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = user.last_daily_reward_at === yesterday
      ? Math.min(user.daily_login_streak + 1, ECONOMY.DAILY_LOGIN.max_streak_days)
      : 1;

    const streakBonus = Math.min(
      newStreak * ECONOMY.DAILY_LOGIN.streak_bonus_per_day,
      ECONOMY.DAILY_LOGIN.max_streak_bonus
    );
    const totalReward = ECONOMY.DAILY_LOGIN.base_coins + streakBonus;

    await db('users').where({ id: userId }).update({
      daily_login_streak: newStreak,
      last_daily_reward_at: today,
    });

    await this.earnCoins(userId, totalReward, 'reward', { type: 'daily_login', streak: newStreak });

    return { coins: totalReward, streak: newStreak };
  },

  calculateLevel(totalExp: number): number {
    for (let i = ECONOMY.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (totalExp >= ECONOMY.LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  },
};
```

### 7.9 Frontend Components

```
frontend/src/
  components/
    economy/
      CoinDisplay.tsx        -- Coin counter in header (animated on change)
      DailyRewardModal.tsx   -- Daily login reward popup
      TransactionHistory.tsx -- Recent transaction list
      LeaderboardPanel.tsx   -- Coin/level rankings
```

### 7.10 Implementation Tasks

- [ ] Create `economy.config.ts` with all constants
- [ ] Write migration `06_economy_enhancements.sql`
- [ ] Create `economy.service.ts` (spend, earn, daily reward, level calc)
- [ ] Refactor `harvestPlant` to use `EconomyService.earnCoins`
- [ ] Refactor all spending actions to use `EconomyService.spendCoins`
- [ ] Add daily login reward endpoint
- [ ] Add balance/summary endpoint
- [ ] Build CoinDisplay, DailyRewardModal components
- [ ] Update Layout.tsx header with coin display
- [ ] Add transaction logging to all coin flows

---

## 8. Implementation Order & Phase Plan

### 8.1 Detailed Sprint Plan

```
=== Sprint 2.1 (Week 1-2): Foundation ===
  [M5-Core] Economy config + EconomyService (spend/earn wrappers)
  [M1]      Garden Grid tables + model + service
  [M1]      Garden API endpoints
  [M1]      Garden.tsx + GardenGrid.tsx + GardenPlot.tsx (frontend)
  [M1]      Auto-init garden on registration
  Deliverable: Users see 3x3 grid, can plant in 4 unlocked plots

=== Sprint 2.2 (Week 3-4): Resources & Shop ===
  [M4]      Resource tables + model + service
  [M4]      Water tank + regen logic
  [M4]      Resource API endpoints
  [M4]      ResourceBar.tsx + WaterTankWidget.tsx
  [M2]      Shop item catalog + tables + model
  [M2]      Shop service + purchase flow
  [M2]      Inventory service (list, use, equip)
  [M2]      Shop.tsx + InventoryPanel.tsx (frontend)
  Deliverable: Users can buy seeds/fertilizer/pots, water uses tank

=== Sprint 2.3 (Week 5-6): Tools & Economy Loop ===
  [M3]      Tool tables + config + model
  [M3]      Watering can integration (limited uses)
  [M3]      Greenhouse integration (simulation engine)
  [M3]      Sprinkler + cron job
  [M3]      Tool upgrade API + frontend
  [M5]      Daily login reward system
  [M5]      Transaction history + balance summary
  [M5]      CoinDisplay + DailyRewardModal
  [M5]      Economy balance tuning & testing
  Deliverable: Full economy loop working end-to-end

=== Sprint 2.4 (Week 7-8): Polish & Integration Testing ===
  - End-to-end testing of full gameplay loop
  - Economy balance playtesting
  - UI/UX polish (animations, transitions, responsive)
  - Performance optimization (query optimization, caching)
  - Error handling edge cases
  - Documentation update
```

### 8.2 File Creation Summary

#### New Backend Files

| File | Module | Purpose |
|------|--------|---------|
| `src/config/economy.config.ts` | M5 | Economy constants |
| `src/config/tools.config.ts` | M3 | Tool level definitions |
| `src/config/resources.config.ts` | M4 | Resource configs |
| `src/models/GardenGrid.ts` | M1 | Garden grid model |
| `src/models/GardenPlot.ts` | M1 | Garden plot model |
| `src/models/ShopItem.ts` | M2 | Shop item model |
| `src/models/UserInventory.ts` | M2 | User inventory model |
| `src/models/Transaction.ts` | M2/M5 | Transaction log model |
| `src/models/UserTool.ts` | M3 | User tool model |
| `src/models/UserResources.ts` | M4 | User resources model |
| `src/services/garden.service.ts` | M1 | Garden business logic |
| `src/services/shop.service.ts` | M2 | Shop purchase/sell |
| `src/services/inventory.service.ts` | M2 | Inventory management |
| `src/services/tool.service.ts` | M3 | Tool upgrade/assign |
| `src/services/resource.service.ts` | M4 | Resource consume/regen |
| `src/services/economy.service.ts` | M5 | Coin flow wrappers |
| `src/controllers/garden.controller.ts` | M1 | Garden endpoints |
| `src/controllers/shop.controller.ts` | M2 | Shop endpoints |
| `src/controllers/inventory.controller.ts` | M2 | Inventory endpoints |
| `src/controllers/tool.controller.ts` | M3 | Tool endpoints |
| `src/controllers/resource.controller.ts` | M4 | Resource endpoints |
| `src/controllers/economy.controller.ts` | M5 | Economy endpoints |
| `src/routes/garden.routes.ts` | M1 | Garden routes |
| `src/routes/shop.routes.ts` | M2 | Shop routes |
| `src/routes/inventory.routes.ts` | M2 | Inventory routes |
| `src/routes/tool.routes.ts` | M3 | Tool routes |
| `src/routes/resource.routes.ts` | M4 | Resource routes |
| `src/routes/economy.routes.ts` | M5 | Economy routes |
| `src/jobs/sprinklerCron.ts` | M3 | Auto-watering job |
| `src/jobs/resourceRegenCron.ts` | M4 | Resource regen job |
| `migrations/02_garden_grid.sql` | M1 | Garden tables |
| `migrations/03_shop_system.sql` | M2 | Shop + inventory tables |
| `migrations/04_tool_system.sql` | M3 | Tool tables |
| `migrations/05_resource_system.sql` | M4 | Resource tables |
| `migrations/06_economy_enhancements.sql` | M5 | Economy columns |

#### New Frontend Files

| File | Module | Purpose |
|------|--------|---------|
| `src/pages/Garden.tsx` | M1 | Main garden page |
| `src/pages/Shop.tsx` | M2 | Shop page |
| `src/components/garden/GardenGrid.tsx` | M1 | Grid layout |
| `src/components/garden/GardenPlot.tsx` | M1 | Plot tile |
| `src/components/garden/PlotDetailModal.tsx` | M1 | Plot actions |
| `src/components/garden/PlantSelectorModal.tsx` | M1 | Seed selection |
| `src/components/shop/ShopItemCard.tsx` | M2 | Shop item |
| `src/components/shop/ShopCategoryTabs.tsx` | M2 | Category filter |
| `src/components/shop/PurchaseModal.tsx` | M2 | Purchase confirm |
| `src/components/shop/InventoryPanel.tsx` | M2 | Inventory view |
| `src/components/shop/InventoryItemCard.tsx` | M2 | Inventory item |
| `src/components/tools/ToolPanel.tsx` | M3 | Tool management |
| `src/components/tools/ToolCard.tsx` | M3 | Tool display |
| `src/components/tools/ToolUpgradeModal.tsx` | M3 | Upgrade confirm |
| `src/components/tools/ToolAssignModal.tsx` | M3 | Plot assignment |
| `src/components/resources/ResourceBar.tsx` | M4 | Resource bar |
| `src/components/resources/WaterTankWidget.tsx` | M4 | Water tank |
| `src/components/resources/ResourcePanel.tsx` | M4 | Combined view |
| `src/components/economy/CoinDisplay.tsx` | M5 | Coin in header |
| `src/components/economy/DailyRewardModal.tsx` | M5 | Daily reward |
| `src/components/economy/TransactionHistory.tsx` | M5 | History list |
| `src/services/garden.service.ts` | M1 | Garden API calls |
| `src/services/shop.service.ts` | M2 | Shop API calls |
| `src/services/tool.service.ts` | M3 | Tool API calls |
| `src/services/resource.service.ts` | M4 | Resource API calls |
| `src/services/economy.service.ts` | M5 | Economy API calls |

#### Modified Existing Files

| File | Changes |
|------|---------|
| `backend/src/routes/index.ts` | Add garden, shop, inventory, tool, resource, economy routes |
| `backend/src/services/userPlant.service.ts` | Add plot_id, seed consumption, resource deduction |
| `backend/src/services/simulation.service.ts` | Add bonus calculations (fertilizer, pot, greenhouse) |
| `backend/src/jobs/simulationCron.ts` | Account for plot bonuses in growth tick |
| `backend/src/models/User.ts` | Add daily_login_streak, last_daily_reward_at fields |
| `backend/src/models/UserPlant.ts` | Add plot_id field |
| `frontend/src/App.tsx` | Add Garden, Shop routes; change default route to Garden |
| `frontend/src/components/Layout.tsx` | Add navigation for Garden, Shop; add CoinDisplay |
| `frontend/src/contexts/AuthContext.tsx` | Add coins, resources to context |
| `frontend/src/services/plant.service.ts` | Add plot_id to createUserPlant |

---

## 9. Database Migration Strategy

### 9.1 Migration Order

```
01_initial_schema.sql          -- (existing) users, plants, user_plants, etc.
02_garden_grid.sql             -- garden_grids, garden_plots, user_plants.plot_id
03_shop_system.sql             -- shop_items, user_inventory, transactions
04_tool_system.sql             -- user_tools
05_resource_system.sql         -- user_resources
06_economy_enhancements.sql    -- users.daily_login_streak, economy_config
```

### 9.2 Migration Safety Rules

1. All migrations are **additive** (no dropping existing columns/tables).
2. New columns on existing tables use `ALTER TABLE ADD COLUMN` with `DEFAULT` or `NULL`.
3. Each migration is **idempotent** (uses `IF NOT EXISTS`).
4. Seed data for `shop_items` and `economy_config` uses `INSERT ... ON CONFLICT DO NOTHING`.
5. Backward compatible: Phase 1 code continues to work during partial migration.

### 9.3 Data Backfill

After migration, run a one-time backfill script:
1. Create `garden_grids` for all existing users.
2. Create 9 `garden_plots` per garden (4 unlocked, 5 locked).
3. Assign existing `user_plants` to first available unlocked plots.
4. Create `user_resources` for all existing users with default values.
5. Create `user_tools` (watering_can lv1) for all existing users.

---

## 10. Risk & Open Questions

### 10.1 Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Economy inflation | Players accumulate coins too fast, no spending pressure | Tune harvest rewards down; add coin sinks; time-limited events |
| Complexity overwhelm | Too many systems at once for new players | Progressive unlock: tools appear at level 3+; gradual tutorial |
| Performance with grid updates | 9 plots * N users = many simulation ticks | Batch simulation in cron; only update active users (last login < 7d) |
| Sprinkler + water tank edge cases | Auto-water when tank empty | Sprinkler skips if tank empty; sends notification |
| Frontend state complexity | Many resources/tools/inventory to track | Consider Zustand or Redux Toolkit for global state |

### 10.2 Open Questions

1. **Premium currency**: Should we add a premium currency (gems) now, or defer?
   - **Recommendation**: Defer to Phase 3. Focus on coin economy first.

2. **Plant trading between users**: Should users trade plants/items?
   - **Recommendation**: Defer. No multiplayer infrastructure yet.

3. **Seasonal events**: Time-limited shop items?
   - **Recommendation**: `available_from/until` fields are ready. Implement events in Phase 3.

4. **Garden themes**: How deep should garden customization go?
   - **Recommendation**: Keep `theme` field simple for now (string). Visual themes in Phase 3.

5. **Energy system**: Should we enforce energy limits in Phase 2?
   - **Recommendation**: Create the column but set energy to effectively unlimited (100 energy, 10/hr regen). Activate constraints in Phase 3 after testing.

---

## Appendix A: Complete API Reference (Phase 2)

### Garden APIs
```
GET    /api/v1/garden                          -- Get garden with plots
POST   /api/v1/garden                          -- Init garden
POST   /api/v1/garden/plots/:plotId/plant      -- Plant seed in plot
DELETE /api/v1/garden/plots/:plotId/plant       -- Remove plant
POST   /api/v1/garden/plots/:plotId/unlock     -- Unlock plot (coins)
PATCH  /api/v1/garden/plots/:plotId            -- Update plot (pot, deco)
GET    /api/v1/garden/plots/:plotId            -- Get plot detail
```

### Shop & Inventory APIs
```
GET    /api/v1/shop                            -- List shop items
GET    /api/v1/shop/:itemId                    -- Item detail
POST   /api/v1/shop/purchase                   -- Buy item
POST   /api/v1/shop/sell                       -- Sell item
GET    /api/v1/inventory                       -- List inventory
POST   /api/v1/inventory/:id/use              -- Use consumable
POST   /api/v1/inventory/:id/equip            -- Equip to plot
POST   /api/v1/inventory/:id/unequip          -- Unequip
```

### Tool APIs
```
GET    /api/v1/tools                           -- List user tools
GET    /api/v1/tools/:toolType                 -- Tool detail
POST   /api/v1/tools/:toolType/upgrade         -- Upgrade tool
POST   /api/v1/tools/:toolType/refill          -- Refill uses
POST   /api/v1/tools/:toolType/assign          -- Assign plots
POST   /api/v1/tools/:toolType/unassign        -- Unassign plot
```

### Resource APIs
```
GET    /api/v1/resources                       -- Get resources
POST   /api/v1/resources/water/refill          -- Buy water
POST   /api/v1/resources/water/upgrade         -- Upgrade tank
POST   /api/v1/resources/energy/refill         -- Buy energy
```

### Economy APIs
```
POST   /api/v1/economy/daily-reward            -- Claim daily
GET    /api/v1/economy/balance                 -- Balance summary
GET    /api/v1/economy/leaderboard             -- Rankings
GET    /api/v1/transactions                    -- Transaction history
```

### Existing APIs (Phase 1, preserved)
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/plants
GET    /api/v1/plants/:id
POST   /api/v1/user-plants                    -- (modified: requires plot_id + seed)
GET    /api/v1/user-plants
GET    /api/v1/user-plants/:id
PATCH  /api/v1/user-plants/:id
DELETE /api/v1/user-plants/:id
POST   /api/v1/user-plants/:id/water          -- (modified: deducts resources)
POST   /api/v1/user-plants/:id/environment
POST   /api/v1/user-plants/:id/harvest        -- (modified: uses EconomyService)
```
