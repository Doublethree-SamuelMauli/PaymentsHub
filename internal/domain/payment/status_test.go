package payment_test

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/domain"
	"github.com/vanlink-ltda/paymentshub/internal/domain/payment"
)

func TestIsTerminal(t *testing.T) {
	terminals := map[payment.Status]bool{
		payment.StatusSettled:  true,
		payment.StatusRejected: true,
		payment.StatusCanceled: true,
		payment.StatusExpired:  true,
	}
	for _, s := range payment.AllStatuses() {
		require.Equal(t, terminals[s], s.IsTerminal(), "status %s", s)
	}
}

func TestCanTransition_HappyPathPix(t *testing.T) {
	path := []payment.Status{
		payment.StatusReceived,
		payment.StatusValidatedLocal,
		payment.StatusPrevalidated,
		payment.StatusApproved,
		payment.StatusSubmitting,
		payment.StatusSent,
		payment.StatusSettled,
	}
	for i := 0; i < len(path)-1; i++ {
		require.True(t, payment.CanTransition(path[i], path[i+1]),
			"legal transition %s -> %s", path[i], path[i+1])
	}
}

func TestCanTransition_OnHoldRoundTrip(t *testing.T) {
	require.True(t, payment.CanTransition(payment.StatusApproved, payment.StatusOnHold))
	require.True(t, payment.CanTransition(payment.StatusOnHold, payment.StatusApproved))
	require.True(t, payment.CanTransition(payment.StatusOnHold, payment.StatusCanceled))
}

func TestCanTransition_UnderReviewLoopback(t *testing.T) {
	require.True(t, payment.CanTransition(payment.StatusValidatedLocal, payment.StatusUnderReview))
	require.True(t, payment.CanTransition(payment.StatusUnderReview, payment.StatusValidatedLocal))
}

func TestCanTransition_FailedRetryReopensDLQ(t *testing.T) {
	require.True(t, payment.CanTransition(payment.StatusFailed, payment.StatusSubmitting))
}

func TestCanTransition_IllegalSkipsAreRejected(t *testing.T) {
	illegal := [][2]payment.Status{
		{payment.StatusReceived, payment.StatusSent},
		{payment.StatusReceived, payment.StatusSettled},
		{payment.StatusValidatedLocal, payment.StatusApproved},
		{payment.StatusPrevalidated, payment.StatusSubmitting},
		{payment.StatusApproved, payment.StatusSent},
		{payment.StatusSettled, payment.StatusFailed},
		{payment.StatusRejected, payment.StatusApproved},
		{payment.StatusCanceled, payment.StatusSubmitting},
		{payment.StatusExpired, payment.StatusApproved},
	}
	for _, tc := range illegal {
		require.False(t, payment.CanTransition(tc[0], tc[1]),
			"should be illegal: %s -> %s", tc[0], tc[1])
	}
}

func TestTransition_ReturnsWrappedSentinel(t *testing.T) {
	err := payment.Transition(payment.StatusReceived, payment.StatusSent)
	require.Error(t, err)
	require.True(t, errors.Is(err, domain.ErrIllegalTransition))
}

func TestTransition_NilOnLegal(t *testing.T) {
	require.NoError(t, payment.Transition(payment.StatusReceived, payment.StatusValidatedLocal))
}
