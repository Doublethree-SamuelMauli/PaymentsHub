package payment

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"
	"unicode"
)

// Rule errors — callers can wrap with errors.Is to branch cleanly between
// structural problems (user input) and policy violations (business rules).
var (
	ErrValidation = errors.New("payment: validation failed")
	ErrPolicy     = errors.New("payment: policy violation")
)

// Limits caps a single payment / batch window. All fields are optional — zero
// disables the cap for that dimension. Values are in centavos.
type Limits struct {
	MaxSingleCents   int64
	MinSingleCents   int64
	DailyLimitCents  int64
	BatchLimitCents  int64
	BatchMaxItems    int
	PIXDailyCap      int64 // BCB default is R$ 1000 per key (00:00-06:00) — per-tenant override
	TEDHourlyCutoff  int   // TED deadline hour (inclusive). Itaú default 17.
	MinFutureDays    int   // scheduling horizon (0 = today OK)
	MaxFutureDays    int   // scheduling horizon cap (0 = unlimited)
}

// ValidatePayment runs fast, deterministic checks that do not require I/O.
// It enforces:
//   - positive amount, BRL only
//   - payee structure (PIX key shape or bank account triplet)
//   - document number validity (CPF/CNPJ digits + check digits)
//   - schedule within allowed horizon
func ValidatePayment(p *Payment, limits Limits, now time.Time) error {
	if p == nil {
		return fmt.Errorf("%w: payment is nil", ErrValidation)
	}
	if p.Amount.Int64() <= 0 {
		return fmt.Errorf("%w: amount must be > 0", ErrValidation)
	}
	if p.Currency != "" && p.Currency != "BRL" {
		return fmt.Errorf("%w: only BRL is supported (got %s)", ErrValidation, p.Currency)
	}
	if p.Type != TypePIX && p.Type != TypeTED {
		return fmt.Errorf("%w: type must be PIX or TED", ErrValidation)
	}

	if err := validatePayeeShape(p); err != nil {
		return err
	}
	if err := validateSchedule(p, limits, now); err != nil {
		return err
	}
	if err := validateLimits(p, limits); err != nil {
		return err
	}
	if err := validateCutoff(p, limits, now); err != nil {
		return err
	}
	return nil
}

func validatePayeeShape(p *Payment) error {
	if len(p.Payee) == 0 {
		return fmt.Errorf("%w: payee required", ErrValidation)
	}
	switch p.PayeeMethod {
	case PayeeMethodPIXKey:
		keyType, _ := p.Payee["key_type"].(string)
		keyValue, _ := p.Payee["key_value"].(string)
		if keyType == "" || keyValue == "" {
			return fmt.Errorf("%w: PIX key_type and key_value required", ErrValidation)
		}
		if err := ValidatePIXKey(keyType, keyValue); err != nil {
			return fmt.Errorf("%w: %v", ErrValidation, err)
		}
	case PayeeMethodBankAccount:
		bank, _ := p.Payee["bank_code"].(string)
		agency, _ := p.Payee["agency"].(string)
		account, _ := p.Payee["account"].(string)
		if !digitsOnly(bank) || len(bank) != 3 {
			return fmt.Errorf("%w: bank_code must be 3 digits", ErrValidation)
		}
		if !digitsOnly(agency) || len(agency) < 3 || len(agency) > 5 {
			return fmt.Errorf("%w: agency must be 3-5 digits", ErrValidation)
		}
		if !digitsOnly(account) || len(account) < 4 {
			return fmt.Errorf("%w: account must be at least 4 digits", ErrValidation)
		}
		doc, _ := p.Payee["document_number"].(string)
		if doc != "" {
			if err := ValidateDocumentNumber(doc); err != nil {
				return fmt.Errorf("%w: %v", ErrValidation, err)
			}
		}
	default:
		return fmt.Errorf("%w: payee_method invalid", ErrValidation)
	}
	return nil
}

func validateSchedule(p *Payment, limits Limits, now time.Time) error {
	if p.ScheduledFor == nil {
		return nil
	}
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	scheduled := time.Date(p.ScheduledFor.Year(), p.ScheduledFor.Month(), p.ScheduledFor.Day(), 0, 0, 0, 0, now.Location())
	diffDays := int(scheduled.Sub(today).Hours() / 24)

	if diffDays < 0 {
		return fmt.Errorf("%w: scheduled_for is in the past", ErrValidation)
	}
	if limits.MinFutureDays > 0 && diffDays < limits.MinFutureDays {
		return fmt.Errorf("%w: scheduled_for must be at least %d days ahead", ErrPolicy, limits.MinFutureDays)
	}
	if limits.MaxFutureDays > 0 && diffDays > limits.MaxFutureDays {
		return fmt.Errorf("%w: scheduled_for exceeds %d days horizon", ErrPolicy, limits.MaxFutureDays)
	}
	return nil
}

func validateLimits(p *Payment, limits Limits) error {
	amt := p.Amount.Int64()
	if limits.MinSingleCents > 0 && amt < limits.MinSingleCents {
		return fmt.Errorf("%w: amount %d below minimum %d", ErrPolicy, amt, limits.MinSingleCents)
	}
	if limits.MaxSingleCents > 0 && amt > limits.MaxSingleCents {
		return fmt.Errorf("%w: amount %d exceeds single cap %d", ErrPolicy, amt, limits.MaxSingleCents)
	}
	return nil
}

// validateCutoff enforces the TED cutoff and the PIX nightly cap window.
// PIX: between 20:00 and 06:00, transfers above PIXDailyCap are blocked.
// TED: after cutoff (default 17:00), must be scheduled for next business day.
func validateCutoff(p *Payment, limits Limits, now time.Time) error {
	if p.Type == TypeTED && p.ScheduledFor == nil {
		cutoff := limits.TEDHourlyCutoff
		if cutoff == 0 {
			cutoff = 17
		}
		if now.Hour() >= cutoff {
			return fmt.Errorf("%w: TED past %d:00 cutoff, must schedule next business day", ErrPolicy, cutoff)
		}
	}
	if p.Type == TypePIX && limits.PIXDailyCap > 0 {
		hour := now.Hour()
		inNightWindow := hour >= 20 || hour < 6
		if inNightWindow && p.Amount.Int64() > limits.PIXDailyCap {
			return fmt.Errorf("%w: PIX between 20:00-06:00 limited to %d cents", ErrPolicy, limits.PIXDailyCap)
		}
	}
	return nil
}

// BatchAggregate represents the running totals of a PaymentRun being built.
// It is the minimum info the batch validator needs.
type BatchAggregate struct {
	ItemCount  int
	TotalCents int64
	Date       time.Time
}

// ValidateBatch runs batch-level guards applied before a run is approved.
func ValidateBatch(items []*Payment, limits Limits, now time.Time) error {
	if len(items) == 0 {
		return fmt.Errorf("%w: batch has no items", ErrValidation)
	}
	if limits.BatchMaxItems > 0 && len(items) > limits.BatchMaxItems {
		return fmt.Errorf("%w: batch has %d items, max is %d", ErrPolicy, len(items), limits.BatchMaxItems)
	}
	var total int64
	for i, p := range items {
		if err := ValidatePayment(p, limits, now); err != nil {
			return fmt.Errorf("item %d (%s): %w", i, p.ID, err)
		}
		total += p.Amount.Int64()
		if limits.DailyLimitCents > 0 && total > limits.DailyLimitCents {
			return fmt.Errorf("%w: batch total %d exceeds daily limit %d", ErrPolicy, total, limits.DailyLimitCents)
		}
		if limits.BatchLimitCents > 0 && total > limits.BatchLimitCents {
			return fmt.Errorf("%w: batch total %d exceeds batch cap %d", ErrPolicy, total, limits.BatchLimitCents)
		}
	}
	return nil
}

// ─── PIX key validation ───

var (
	reCPF   = regexp.MustCompile(`^\d{11}$`)
	reCNPJ  = regexp.MustCompile(`^\d{14}$`)
	reEmail = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)
	rePhone = regexp.MustCompile(`^\+?55\d{10,11}$`)
	reEVP   = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)
)

// ValidatePIXKey checks the structural shape of a PIX key based on its type.
// keyType must be one of: CPF, CNPJ, EMAIL, PHONE, EVP.
func ValidatePIXKey(keyType, value string) error {
	value = strings.TrimSpace(value)
	if value == "" {
		return errors.New("pix key empty")
	}
	switch strings.ToUpper(keyType) {
	case "CPF":
		digits := stripDigits(value)
		if !reCPF.MatchString(digits) {
			return errors.New("CPF must be 11 digits")
		}
		return validateCPFCheckDigits(digits)
	case "CNPJ":
		digits := stripDigits(value)
		if !reCNPJ.MatchString(digits) {
			return errors.New("CNPJ must be 14 digits")
		}
		return validateCNPJCheckDigits(digits)
	case "EMAIL":
		if !reEmail.MatchString(value) {
			return errors.New("email shape invalid")
		}
		if len(value) > 77 { // BCB limit
			return errors.New("email exceeds 77 chars")
		}
		return nil
	case "PHONE":
		cleaned := strings.ReplaceAll(strings.ReplaceAll(value, " ", ""), "-", "")
		cleaned = strings.ReplaceAll(cleaned, "(", "")
		cleaned = strings.ReplaceAll(cleaned, ")", "")
		if !strings.HasPrefix(cleaned, "+") {
			cleaned = "+55" + stripDigits(cleaned)
		}
		if !rePhone.MatchString(cleaned) {
			return errors.New("phone must be E.164 +55DDNNNNNNNN")
		}
		return nil
	case "EVP":
		if !reEVP.MatchString(value) {
			return errors.New("EVP must be a UUID")
		}
		return nil
	default:
		return fmt.Errorf("unknown pix key type %q", keyType)
	}
}

// ValidateDocumentNumber accepts a raw CPF or CNPJ string (with or without
// formatting) and returns an error if the structure/check digits are invalid.
func ValidateDocumentNumber(doc string) error {
	digits := stripDigits(doc)
	switch len(digits) {
	case 11:
		return validateCPFCheckDigits(digits)
	case 14:
		return validateCNPJCheckDigits(digits)
	default:
		return fmt.Errorf("document must be 11 (CPF) or 14 (CNPJ) digits, got %d", len(digits))
	}
}

func validateCPFCheckDigits(d string) error {
	if allSameRune(d) {
		return errors.New("CPF with all-same digits is invalid")
	}
	mult := [2]int{10, 11}
	for i := 0; i < 2; i++ {
		sum := 0
		for j := 0; j < 9+i; j++ {
			sum += int(d[j]-'0') * (mult[i] - j)
		}
		rem := sum * 10 % 11
		if rem == 10 {
			rem = 0
		}
		if rem != int(d[9+i]-'0') {
			return errors.New("CPF check digits invalid")
		}
	}
	return nil
}

func validateCNPJCheckDigits(d string) error {
	if allSameRune(d) {
		return errors.New("CNPJ with all-same digits is invalid")
	}
	weights := [][]int{
		{5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2},
		{6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2},
	}
	for i, w := range weights {
		sum := 0
		for j, wj := range w {
			sum += int(d[j]-'0') * wj
		}
		rem := sum % 11
		exp := 0
		if rem >= 2 {
			exp = 11 - rem
		}
		if exp != int(d[12+i]-'0') {
			return errors.New("CNPJ check digits invalid")
		}
	}
	return nil
}

// ─── helpers ───

func digitsOnly(s string) bool {
	if s == "" {
		return false
	}
	for _, r := range s {
		if !unicode.IsDigit(r) {
			return false
		}
	}
	return true
}

func stripDigits(s string) string {
	var b strings.Builder
	for _, r := range s {
		if unicode.IsDigit(r) {
			b.WriteRune(r)
		}
	}
	return b.String()
}

func allSameRune(s string) bool {
	if len(s) == 0 {
		return false
	}
	first := s[0]
	for i := 1; i < len(s); i++ {
		if s[i] != first {
			return false
		}
	}
	return true
}
