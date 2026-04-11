// Package cnab models the CNAB 240 file lifecycle (remessa + retorno).
// The actual byte-level encoder/decoder lives in internal/adapters/banks/itau/cnab
// and is introduced in Plan 06.
package cnab

import (
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/vanlink-ltda/paymentshub/internal/domain"
)

type Status string

const (
	StatusDraft          Status = "DRAFT"
	StatusGenerated      Status = "GENERATED"
	StatusUploaded       Status = "UPLOADED"
	StatusAwaitingReturn Status = "AWAITING_RETURN"
	StatusReturned       Status = "RETURNED"
	StatusClosed         Status = "CLOSED"
	StatusFailed         Status = "FAILED"
)

func (s Status) IsTerminal() bool {
	return s == StatusClosed || s == StatusFailed
}

type Direction string

const (
	DirectionRemessa Direction = "REMESSA"
	DirectionRetorno Direction = "RETORNO"
)

var allowed = map[Status]map[Status]struct{}{
	StatusDraft:          {StatusGenerated: {}, StatusFailed: {}},
	StatusGenerated:      {StatusUploaded: {}, StatusFailed: {}},
	StatusUploaded:       {StatusAwaitingReturn: {}, StatusFailed: {}},
	StatusAwaitingReturn: {StatusReturned: {}, StatusFailed: {}},
	StatusReturned:       {StatusClosed: {}, StatusFailed: {}},
}

func CanTransition(from, to Status) bool {
	d, ok := allowed[from]
	if !ok {
		return false
	}
	_, ok = d[to]
	return ok
}

func Transition(from, to Status) error {
	if !CanTransition(from, to) {
		return fmt.Errorf("%w: %s -> %s", domain.ErrIllegalTransition, from, to)
	}
	return nil
}

// File is the in-memory representation of a cnab_files row.
type File struct {
	ID             uuid.UUID
	RunID          uuid.UUID
	BankCode       string
	LayoutVersion  string
	SequenceNumber int
	Direction      Direction
	FilePath       string
	FileHash       string
	Status         Status
	TotalItems     int
	GeneratedAt    *time.Time
	UploadedAt     *time.Time
	UploadAck      string
	ReturnedAt     *time.Time
	ProcessedAt    *time.Time
}

func (f *File) ApplyTransition(to Status) error {
	if err := Transition(f.Status, to); err != nil {
		return err
	}
	f.Status = to
	return nil
}
