package models

import "time"

// SellerDeepReport corresponds to the 'daily_sales_reports' table
type SellerDeepReport struct {
	ID             int       `json:"id" db:"id"`
	SellerID       string    `json:"sellerId" db:"seller_id"`
	ReportDate     time.Time `json:"reportDate" db:"report_date"`
	TotalRevenue   float64   `json:"totalRevenue" db:"total_revenue"`
	OrderCount     int       `json:"orderCount" db:"order_count"`
	ConversionRate float64   `json:"conversionRate" db:"conversion_rate"`
}

// CommunityEconomicTrend corresponds to the 'province_economic_trends' table
type CommunityEconomicTrend struct {
	Province          string    `json:"province" db:"province"`
	Category          string    `json:"category" db:"category"`
	GrowthIndex       float64   `json:"growthIndex" db:"growth_index"`
	TransactionVolume float64   `json:"transactionVolume" db:"transaction_volume"`
	LastUpdated       time.Time `json:"lastUpdated" db:"last_updated"`
}
