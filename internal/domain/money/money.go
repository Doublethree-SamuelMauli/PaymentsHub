// Package money provides integer-cent monetary values with BRL formatting.
//
// Using int64 cents avoids floating-point rounding errors and matches the
// database schema (amount_cents BIGINT).
package money

import (
	"fmt"
	"strings"
)

// Cents is a signed 64-bit monetary value expressed in the smallest unit (centavos).
type Cents int64

// Add returns the sum of two Cents.
func (c Cents) Add(other Cents) Cents { return c + other }

// Sub returns the difference between two Cents.
func (c Cents) Sub(other Cents) Cents { return c - other }

// IsPositive reports whether the value is strictly greater than zero.
func (c Cents) IsPositive() bool { return c > 0 }

// IsZero reports whether the value equals zero.
func (c Cents) IsZero() bool { return c == 0 }

// Int64 returns the underlying integer representation.
func (c Cents) Int64() int64 { return int64(c) }

// FormatBRL renders the value as "R$ 1.234,56".
func (c Cents) FormatBRL() string {
	neg := c < 0
	n := int64(c)
	if neg {
		n = -n
	}

	reais := n / 100
	cents := n % 100

	var b strings.Builder
	if neg {
		b.WriteByte('-')
	}
	b.WriteString("R$ ")
	b.WriteString(groupThousands(reais))
	b.WriteByte(',')
	fmt.Fprintf(&b, "%02d", cents)
	return b.String()
}

func groupThousands(n int64) string {
	s := fmt.Sprintf("%d", n)
	if len(s) <= 3 {
		return s
	}
	var out []byte
	for i, r := range []byte(s) {
		if i > 0 && (len(s)-i)%3 == 0 {
			out = append(out, '.')
		}
		out = append(out, r)
	}
	return string(out)
}
