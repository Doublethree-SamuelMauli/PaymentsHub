// Package cnab encodes and decodes CNAB 240 files for Itaú (SISPAG).
//
// Only the subset of segments needed for TED (header arquivo/lote, segmento A,
// segmento B, trailer lote/arquivo) is implemented. Boleto/tributos/folha
// segments can be added incrementally without changing the public API.
//
// FEBRABAN reference: CNAB 240 v10.7.
// Itaú specialization reference: Manual Técnico SISPAG.
package cnab

import (
	"fmt"
	"strings"
	"unicode"
)

// LineWidth is the canonical width of every CNAB 240 record line.
const LineWidth = 240

// PadLeftNum left-pads a numeric value with zeros to the given width.
// If the value is longer, it is truncated (the caller is expected to validate
// widths upstream — truncation is the safer failure mode than panic).
func PadLeftNum(value int64, width int) string {
	s := fmt.Sprintf("%d", value)
	if len(s) >= width {
		return s[len(s)-width:]
	}
	return strings.Repeat("0", width-len(s)) + s
}

// PadLeftNumStr is PadLeftNum for values already in string form.
func PadLeftNumStr(s string, width int) string {
	s = stripNonDigits(s)
	if len(s) >= width {
		return s[len(s)-width:]
	}
	return strings.Repeat("0", width-len(s)) + s
}

// PadRightAlpha right-pads an alphanumeric value with spaces to the given
// width. Accents are stripped and characters are upper-cased (SISPAG Itaú
// rejects lowercase in most fields).
func PadRightAlpha(s string, width int) string {
	s = normalizeAlpha(s)
	if len(s) >= width {
		return s[:width]
	}
	return s + strings.Repeat(" ", width-len(s))
}

// Blank returns `width` spaces — used for reserved fields.
func Blank(width int) string { return strings.Repeat(" ", width) }

// Zeros returns `width` zeros.
func Zeros(width int) string { return strings.Repeat("0", width) }

// ReadNum parses a numeric substring.
func ReadNum(line []byte, start, end int) int64 {
	slice := strings.TrimSpace(string(line[start:end]))
	if slice == "" {
		return 0
	}
	var n int64
	for _, c := range slice {
		if c >= '0' && c <= '9' {
			n = n*10 + int64(c-'0')
		}
	}
	return n
}

// ReadString parses an alphanumeric substring and trims trailing spaces.
func ReadString(line []byte, start, end int) string {
	return strings.TrimRight(string(line[start:end]), " ")
}

// stripNonDigits keeps only 0-9.
func stripNonDigits(s string) string {
	var b strings.Builder
	for _, r := range s {
		if r >= '0' && r <= '9' {
			b.WriteRune(r)
		}
	}
	return b.String()
}

// normalizeAlpha removes accents, upper-cases, and drops non-printable chars.
// Preserves a small set of punctuation used in names and descriptions.
func normalizeAlpha(s string) string {
	var b strings.Builder
	for _, r := range s {
		switch r {
		case 'á', 'à', 'â', 'ã', 'Á', 'À', 'Â', 'Ã':
			b.WriteByte('A')
		case 'é', 'è', 'ê', 'É', 'È', 'Ê':
			b.WriteByte('E')
		case 'í', 'ì', 'Í', 'Ì':
			b.WriteByte('I')
		case 'ó', 'ò', 'ô', 'õ', 'Ó', 'Ò', 'Ô', 'Õ':
			b.WriteByte('O')
		case 'ú', 'ù', 'Ú', 'Ù', 'ü', 'Ü':
			b.WriteByte('U')
		case 'ç', 'Ç':
			b.WriteByte('C')
		default:
			if unicode.IsPrint(r) {
				if r >= 'a' && r <= 'z' {
					r -= 32
				}
				b.WriteRune(r)
			}
		}
	}
	return b.String()
}
