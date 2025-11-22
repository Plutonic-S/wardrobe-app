// Analytics Types and Interfaces

export type TimeRange = '7d' | '30d' | '3m' | '1y' | 'all';

export interface TimeRangeOption {
  value: TimeRange;
  label: string;
  days?: number; // undefined for 'all'
}

// Quick Stats
export interface QuickStats {
  totalOutfits: number;
  outfitsWornThisMonth: number;
  itemsNeverUsed: number;
  averageCPW: number | null; // null if no items have prices
}

// Outfit Analytics
export interface OutfitWearData {
  outfitId: string;
  name: string;
  wearCount: number;
  lastWorn: string | null;
  favorite: boolean;
  mode: 'dress-me' | 'canvas';
  previewImageUrl?: string;
}

export interface StyleTypeDistribution {
  dressMe: number;
  canvas: number;
  total: number;
  configBreakdown: {
    '2-part': number;
    '3-part': number;
    '4-part': number;
  };
}

// Wardrobe Utilization
export interface ItemUsageData {
  itemId: string;
  name: string;
  category: string;
  usageCount: number;
  lastUsed: string | null;
  imageUrl?: string;
  thumbnailUrl?: string;
}

export interface CategoryUtilization {
  category: string;
  totalItems: number;
  usedItems: number;
  utilizationRate: number; // percentage (0-100)
  averageUsesPerItem: number;
}

export interface WardrobeUtilization {
  categoryUtilization: CategoryUtilization[];
  mostUsedItems: ItemUsageData[];
  leastUsedItems: ItemUsageData[];
  unusedItems: ItemUsageData[];
}

// Color Analysis
export interface ColorData {
  color: string;
  count: number;
  percentage: number;
}

export interface ColorAnalysis {
  wardrobeColors: ColorData[];
  outfitColorFrequency: ColorData[];
  colorDiversityScore: number; // 0-100
  popularCombinations?: Array<{
    colors: string[];
    frequency: number;
  }>;
}

// Cost Per Wear
export interface ItemCPWData {
  itemId: string;
  name: string;
  category: string;
  price: number;
  wearCount: number;
  costPerWear: number;
  roi: 'excellent' | 'good' | 'fair' | 'poor' | 'unused';
  imageUrl?: string;
  thumbnailUrl?: string;
}

export interface CostPerWearStats {
  itemsCPW: ItemCPWData[];
  totalWardrobeValue: number;
  averageCPW: number | null;
  mostCostEffective: ItemCPWData[]; // top 10
  leastCostEffective: ItemCPWData[]; // bottom 10
  itemsWithoutPrice: number;
}

// Time-Based Trends
export interface TrendDataPoint {
  date: string;
  count: number;
}

export interface SeasonalBreakdown {
  season: string;
  outfitCount: number;
  wearCount: number;
}

export interface TrendsData {
  outfitCreation: TrendDataPoint[];
  outfitWearing: TrendDataPoint[];
  seasonalBreakdown: SeasonalBreakdown[];
}

// API Response Types
export interface AnalyticsOverviewResponse {
  quickStats: QuickStats;
  outfitWearFrequency: OutfitWearData[];
  styleTypeDistribution: StyleTypeDistribution;
  timeRange: TimeRange;
}

export interface WardrobeUtilizationResponse {
  utilization: WardrobeUtilization;
  timeRange: TimeRange;
}

export interface CostPerWearResponse {
  stats: CostPerWearStats;
  timeRange: TimeRange;
}

export interface TrendsResponse {
  trends: TrendsData;
  timeRange: TimeRange;
  granularity: 'day' | 'week' | 'month';
}

// Chart Data Types (for Recharts)
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface BarChartData {
  name: string;
  value: number;
  fill?: string;
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}
