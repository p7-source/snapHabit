# Tables Required for Daily Aggregated Macros

## ✅ REQUIRED (Minimum): Only 1 Table

### `meals` Table
**This is the ONLY table you absolutely need.**

```sql
CREATE TABLE meals (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,           -- To identify which user
  food_name TEXT NOT NULL,
  calories INTEGER,                 -- Individual meal calories
  macros JSONB,                     -- { protein: 50, carbs: 30, fat: 10 }
  created_at TIMESTAMP DEFAULT NOW() -- To filter by date
);
```

**How to get daily aggregated macros:**
```sql
-- Query meals for today
SELECT 
  user_id,
  DATE(created_at) as date,
  SUM(calories) as total_calories,
  SUM((macros->>'protein')::numeric) as total_protein,
  SUM((macros->>'carbs')::numeric) as total_carbs,
  SUM((macros->>'fat')::numeric) as total_fat
FROM meals
WHERE user_id = 'your-user-id'
  AND DATE(created_at) = CURRENT_DATE
GROUP BY user_id, DATE(created_at);
```

**OR in frontend:**
1. Fetch all meals: `SELECT * FROM meals WHERE user_id = ?`
2. Filter by date (today)
3. Sum up calories and macros

---

## 🚀 OPTIONAL (Better Performance): 2 Tables

### 1. `meals` Table (same as above)
- Stores individual meals

### 2. `daily_summaries` Table (OPTIONAL)
- Pre-calculated daily totals
- Updated automatically via database triggers
- Faster queries (no need to calculate on-the-fly)

```sql
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,                -- Just the date (YYYY-MM-DD)
  total_calories INTEGER DEFAULT 0,
  total_protein DECIMAL(10, 2) DEFAULT 0,
  total_carbs DECIMAL(10, 2) DEFAULT 0,
  total_fat DECIMAL(10, 2) DEFAULT 0,
  meal_count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)              -- One summary per user per day
);
```

**How to get daily aggregated macros:**
```sql
-- Much simpler query
SELECT * FROM daily_summaries
WHERE user_id = 'your-user-id'
  AND date = CURRENT_DATE;
```

---

## 📊 Summary

| Approach | Tables Required | Query Complexity | Performance | Update Reliability |
|----------|----------------|------------------|-------------|-------------------|
| **Minimum** | `meals` only | Complex (SUM, GROUP BY) | Slower | Can have timing issues |
| **Recommended** | `meals` + `daily_summaries` | Simple (SELECT) | Faster | Always accurate (auto-updated) |

---

## 🎯 Answer to Your Question

**To find daily aggregated macros, you need:**

1. **REQUIRED:** `meals` table (you already have this)
2. **OPTIONAL:** `daily_summaries` table (recommended for better performance and reliability)

**You can do it with just the `meals` table**, but using `daily_summaries` is better because:
- ✅ Faster queries
- ✅ No calculation needed
- ✅ Always accurate (auto-updated via triggers)
- ✅ Solves the dashboard update issues you're experiencing

