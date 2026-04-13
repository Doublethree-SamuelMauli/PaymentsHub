package app

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/db/dbgen"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
)

// PreAnalysisVerdict is what the rules engine returns per payment.
type PreAnalysisVerdict struct {
	Action string // "ALLOW" | "REVIEW" | "REJECT"
	Reason string
	Rule   string // which rule triggered
}

// PreAnalysisService evaluates configurable rules against incoming payments:
// blacklist check, duplicate detection, limit enforcement.
type PreAnalysisService struct {
	pool *pgxpool.Pool
	q    *dbgen.Queries
}

func NewPreAnalysisService(pool *pgxpool.Pool) *PreAnalysisService {
	return &PreAnalysisService{pool: pool, q: dbgen.New(pool)}
}

// Evaluate runs all configured rules for a payment and returns the most
// restrictive verdict. REJECT > REVIEW > ALLOW.
func (s *PreAnalysisService) Evaluate(ctx context.Context, p *payment.Payment) (*PreAnalysisVerdict, error) {
	if p.ClientID == nil {
		return &PreAnalysisVerdict{Action: "ALLOW", Rule: "no_client"}, nil
	}
	clientID := *p.ClientID

	// Rule 1: Blacklist check
	if verdict, err := s.checkBlacklist(ctx, clientID, p); err != nil {
		return nil, err
	} else if verdict != nil {
		return verdict, nil
	}

	// Rule 2: Single payment limit
	if verdict, err := s.checkSingleLimit(ctx, clientID, p); err != nil {
		return nil, err
	} else if verdict != nil {
		return verdict, nil
	}

	// Rule 3: Daily limit
	if verdict, err := s.checkDailyLimit(ctx, clientID, p); err != nil {
		return nil, err
	} else if verdict != nil {
		return verdict, nil
	}

	// Rule 4: Monthly limit
	if verdict, err := s.checkMonthlyLimit(ctx, clientID, p); err != nil {
		return nil, err
	} else if verdict != nil {
		return verdict, nil
	}

	// Rule 5: Duplicate detection
	if verdict, err := s.checkDuplicate(ctx, clientID, p); err != nil {
		return nil, err
	} else if verdict != nil {
		return verdict, nil
	}

	return &PreAnalysisVerdict{Action: "ALLOW", Rule: "all_passed"}, nil
}

func (s *PreAnalysisService) checkBlacklist(ctx context.Context, clientID uuid.UUID, p *payment.Payment) (*PreAnalysisVerdict, error) {
	beneficiaryDoc := ""
	if snap, ok := p.BeneficiarySnapshot["document_number"].(string); ok {
		beneficiaryDoc = snap
	}
	if payeeDoc, ok := p.Payee["document_number"].(string); ok && beneficiaryDoc == "" {
		beneficiaryDoc = payeeDoc
	}
	if beneficiaryDoc == "" {
		return nil, nil
	}

	entries, err := s.q.CheckBlacklist(ctx, dbgen.CheckBlacklistParams{
		DocumentNumber: beneficiaryDoc,
		ClientID:       uuidToPg(clientID),
	})
	if err != nil {
		return nil, fmt.Errorf("check blacklist: %w", err)
	}
	if len(entries) > 0 {
		return &PreAnalysisVerdict{
			Action: "REJECT",
			Reason: "beneficiary document " + beneficiaryDoc + " is blacklisted: " + entries[0].Reason,
			Rule:   "blacklist",
		}, nil
	}
	return nil, nil
}

func (s *PreAnalysisService) checkSingleLimit(ctx context.Context, clientID uuid.UUID, p *payment.Payment) (*PreAnalysisVerdict, error) {
	limits, err := s.q.GetClientLimit(ctx, uuidToPg(clientID))
	if err != nil {
		return nil, nil // no limits configured = allow
	}
	if limits.MaxSingleCents > 0 && p.Amount.Int64() > limits.MaxSingleCents {
		return &PreAnalysisVerdict{
			Action: "REVIEW",
			Reason: fmt.Sprintf("amount %d exceeds single-payment limit %d", p.Amount.Int64(), limits.MaxSingleCents),
			Rule:   "max_single",
		}, nil
	}
	if limits.RequireApprovalAbove > 0 && p.Amount.Int64() > limits.RequireApprovalAbove {
		return &PreAnalysisVerdict{
			Action: "REVIEW",
			Reason: fmt.Sprintf("amount %d above approval threshold %d", p.Amount.Int64(), limits.RequireApprovalAbove),
			Rule:   "approval_threshold",
		}, nil
	}
	return nil, nil
}

func (s *PreAnalysisService) checkDailyLimit(ctx context.Context, clientID uuid.UUID, p *payment.Payment) (*PreAnalysisVerdict, error) {
	limits, err := s.q.GetClientLimit(ctx, uuidToPg(clientID))
	if err != nil {
		return nil, nil
	}
	if limits.DailyLimitCents <= 0 {
		return nil, nil
	}
	todayTotal, err := s.q.SumPaymentsTodayByClient(ctx, uuidToPg(clientID))
	if err != nil {
		return nil, fmt.Errorf("sum today: %w", err)
	}
	if todayTotal+p.Amount.Int64() > limits.DailyLimitCents {
		return &PreAnalysisVerdict{
			Action: "REVIEW",
			Reason: fmt.Sprintf("daily total %d + %d would exceed limit %d", todayTotal, p.Amount.Int64(), limits.DailyLimitCents),
			Rule:   "daily_limit",
		}, nil
	}
	return nil, nil
}

func (s *PreAnalysisService) checkMonthlyLimit(ctx context.Context, clientID uuid.UUID, p *payment.Payment) (*PreAnalysisVerdict, error) {
	limits, err := s.q.GetClientLimit(ctx, uuidToPg(clientID))
	if err != nil {
		return nil, nil
	}
	if limits.MonthlyLimitCents <= 0 {
		return nil, nil
	}
	monthTotal, err := s.q.SumPaymentsMonthByClient(ctx, uuidToPg(clientID))
	if err != nil {
		return nil, fmt.Errorf("sum month: %w", err)
	}
	if monthTotal+p.Amount.Int64() > limits.MonthlyLimitCents {
		return &PreAnalysisVerdict{
			Action: "REVIEW",
			Reason: fmt.Sprintf("monthly total %d + %d would exceed limit %d", monthTotal, p.Amount.Int64(), limits.MonthlyLimitCents),
			Rule:   "monthly_limit",
		}, nil
	}
	return nil, nil
}

func (s *PreAnalysisService) checkDuplicate(ctx context.Context, clientID uuid.UUID, p *payment.Payment) (*PreAnalysisVerdict, error) {
	rule, err := s.q.GetDuplicateRule(ctx, uuidToPg(clientID))
	if err != nil {
		return nil, nil // no rule = allow
	}

	if p.BeneficiaryID == nil {
		return nil, nil
	}

	windowStart := time.Now().Add(-time.Duration(rule.WindowHours) * time.Hour)
	dupes, err := s.q.FindDuplicatePayments(ctx, dbgen.FindDuplicatePaymentsParams{
		ClientID:      uuidToPg(clientID),
		BeneficiaryID: uuidToPg(*p.BeneficiaryID),
		AmountCents:   p.Amount.Int64(),
		CreatedAt:     pgtype.Timestamptz{Time: windowStart, Valid: true},
		ID:            uuidToPg(p.ID),
	})
	if err != nil {
		return nil, fmt.Errorf("find duplicates: %w", err)
	}

	if len(dupes) > 0 {
		action := rule.Action
		return &PreAnalysisVerdict{
			Action: action,
			Reason: fmt.Sprintf("duplicate detected: %d similar payments in last %dh", len(dupes), rule.WindowHours),
			Rule:   "duplicate",
		}, nil
	}
	return nil, nil
}

func uuidToPg(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: id, Valid: true}
}
