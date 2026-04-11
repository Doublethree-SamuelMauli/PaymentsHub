package run_test

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/domain"
	"github.com/vanlink-ltda/paymentshub/internal/domain/run"
)

func TestRun_HappyPath(t *testing.T) {
	path := []run.Status{
		run.StatusOpen,
		run.StatusApproved,
		run.StatusExecuting,
		run.StatusPartiallySettled,
		run.StatusClosed,
	}
	for i := 0; i < len(path)-1; i++ {
		require.True(t, run.CanTransition(path[i], path[i+1]),
			"legal %s -> %s", path[i], path[i+1])
	}
}

func TestRun_IllegalTransitions(t *testing.T) {
	illegal := [][2]run.Status{
		{run.StatusOpen, run.StatusExecuting},
		{run.StatusApproved, run.StatusClosed},
		{run.StatusClosed, run.StatusOpen},
	}
	for _, tc := range illegal {
		require.False(t, run.CanTransition(tc[0], tc[1]))
	}
}

func TestRun_TransitionReturnsSentinel(t *testing.T) {
	err := run.Transition(run.StatusOpen, run.StatusExecuting)
	require.True(t, errors.Is(err, domain.ErrIllegalTransition))
}

func TestRun_Terminals(t *testing.T) {
	require.True(t, run.StatusClosed.IsTerminal())
	require.True(t, run.StatusFailed.IsTerminal())
	require.False(t, run.StatusOpen.IsTerminal())
}
