package banks

import (
	"errors"
	"fmt"
	"sync"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/bb"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/bradesco"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/btg"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/caixa"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/inter"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/santander"
	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/sicoob"
	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
)

// ErrUnknownBank is returned when Lookup is called with a bank_code that has
// not been registered.
var ErrUnknownBank = errors.New("banks: unknown bank_code")

// Registry is a goroutine-safe map of bank_code → PaymentGateway. It lets the
// orchestrator select the right adapter per payer_account without threading
// a big map through use cases.
type Registry struct {
	mu       sync.RWMutex
	gateways map[string]ports.PaymentGateway
}

// NewRegistry builds an empty registry.
func NewRegistry() *Registry {
	return &Registry{gateways: make(map[string]ports.PaymentGateway)}
}

// Register binds a gateway to a bank code. Overwrites silently.
func (r *Registry) Register(bankCode string, gw ports.PaymentGateway) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.gateways[bankCode] = gw
}

// Lookup returns the gateway for a bank code or ErrUnknownBank.
func (r *Registry) Lookup(bankCode string) (ports.PaymentGateway, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	gw, ok := r.gateways[bankCode]
	if !ok {
		return nil, fmt.Errorf("%w: %s", ErrUnknownBank, bankCode)
	}
	return gw, nil
}

// List returns all registered bank codes. Stable order not guaranteed.
func (r *Registry) List() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]string, 0, len(r.gateways))
	for code := range r.gateways {
		out = append(out, code)
	}
	return out
}

// SupportedBankCodes is the canonical list of bank codes the platform knows
// how to adapt. Kept in sync with frontend/src/lib/api.ts SUPPORTED_BANKS.
func SupportedBankCodes() []string {
	return []string{
		"341", // Itaú — built in internal/adapters/banks/itau
		bradesco.BankCode,
		santander.BankCode,
		bb.BankCode,
		caixa.BankCode,
		inter.BankCode,
		sicoob.BankCode,
		btg.BankCode,
	}
}
