package cnab_test

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/itau/cnab"
)

func TestLookupOccurrence_OK(t *testing.T) {
	for _, code := range []string{"00", "BD", ""} {
		occ := cnab.LookupOccurrence(code)
		require.Equalf(t, "OK", occ.Verdict, "code %q", code)
	}
}

func TestLookupOccurrence_Known(t *testing.T) {
	occ := cnab.LookupOccurrence("CG")
	require.Equal(t, "REJECT", occ.Verdict)
	require.Contains(t, occ.Description, "Chave PIX")

	occ = cnab.LookupOccurrence("BI")
	require.Equal(t, "REJECT", occ.Verdict)
	require.Contains(t, occ.Description, "saldo")
}

func TestLookupOccurrence_Unknown(t *testing.T) {
	occ := cnab.LookupOccurrence("ZZ")
	require.Equal(t, "REJECT", occ.Verdict)
	require.Contains(t, occ.Description, "desconhec")
}

func TestLookupOccurrence_MultiCode_AllOK(t *testing.T) {
	occ := cnab.LookupOccurrence("00BD00")
	require.Equal(t, "OK", occ.Verdict)
}

func TestLookupOccurrence_MultiCode_OneFails(t *testing.T) {
	occ := cnab.LookupOccurrence("00CG")
	require.Equal(t, "REJECT", occ.Verdict)
	require.Equal(t, "CG", occ.Code)
}
