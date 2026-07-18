package repository

import (
	"context"
	"tuktuk-backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type SQLRepository interface {
	GetSellerReport(ctx context.Context, sellerID string) (*models.SellerDeepReport, error)
	GetCommunityTrends(ctx context.Context, province string) ([]models.CommunityEconomicTrend, error)
}

type sqlRepo struct {
	db *sqlx.DB
}

func NewSQLRepository(db *sqlx.DB) SQLRepository {
	return &sqlRepo{db: db}
}

func (r *sqlRepo) GetSellerReport(ctx context.Context, sellerID string) (*models.SellerDeepReport, error) {
	var report models.SellerDeepReport
	query := `SELECT * FROM daily_sales_reports WHERE seller_id = $1 ORDER BY report_date DESC LIMIT 1`
	err := r.db.GetContext(ctx, &report, query, sellerID)
	if err != nil {
		return nil, err
	}
	return &report, nil
}

func (r *sqlRepo) GetCommunityTrends(ctx context.Context, province string) ([]models.CommunityEconomicTrend, error) {
	var trends []models.CommunityEconomicTrend
	var err error
	if province == "all" || province == "" {
		query := `SELECT * FROM province_economic_trends ORDER BY growth_index DESC LIMIT 10`
		err = r.db.SelectContext(ctx, &trends, query)
	} else {
		query := `SELECT * FROM province_economic_trends WHERE province = $1 ORDER BY growth_index DESC`
		err = r.db.SelectContext(ctx, &trends, query, province)
	}
	return trends, err
}
