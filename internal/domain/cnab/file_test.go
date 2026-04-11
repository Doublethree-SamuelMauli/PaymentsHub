package cnab_test

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/domain/cnab"
)

func TestCnab_HappyPath(t *testing.T) {
	path := []cnab.Status{
		cnab.StatusDraft,
		cnab.StatusGenerated,
		cnab.StatusUploaded,
		cnab.StatusAwaitingReturn,
		cnab.StatusReturned,
		cnab.StatusClosed,
	}
	for i := 0; i < len(path)-1; i++ {
		require.True(t, cnab.CanTransition(path[i], path[i+1]))
	}
}

func TestCnab_FailedIsTerminal(t *testing.T) {
	require.True(t, cnab.StatusFailed.IsTerminal())
	require.True(t, cnab.StatusClosed.IsTerminal())
}

func TestCnab_IllegalSkip(t *testing.T) {
	require.False(t, cnab.CanTransition(cnab.StatusDraft, cnab.StatusUploaded))
}
