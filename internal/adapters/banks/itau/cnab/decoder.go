package cnab

import (
	"bytes"
	"fmt"
	"strings"
)

// ReturnLine is a parsed Segment A return row with the minimum fields needed
// to reconcile a payment: our "nosso numero"/ourNumber (=external_id) and the
// Itaú occurrence code.
type ReturnLine struct {
	BatchNumber     int
	Sequence        int
	OurNumber       string
	AmountCents     int64
	OccurrenceCodes string
	Segment         string // A|B
}

// Return is the full parsed contents of a retorno CNAB 240 file.
type Return struct {
	FileHeader string
	Lines      []ReturnLine
	TotalLines int
}

// Decode parses a retorno file.
// Only Segment A lines are returned — segment B is skipped because it carries
// only beneficiary details that we already have locally.
func Decode(raw []byte) (*Return, error) {
	ret := &Return{}
	reader := bytes.Split(bytes.ReplaceAll(raw, []byte("\r\n"), []byte("\n")), []byte("\n"))
	for _, line := range reader {
		if len(line) == 0 {
			continue
		}
		if len(line) != LineWidth {
			return nil, fmt.Errorf("cnab decode: line width %d != %d", len(line), LineWidth)
		}
		recordType := line[7]
		switch recordType {
		case '0':
			ret.FileHeader = strings.TrimRight(string(line), " ")
		case '3':
			segment := string(line[13])
			if segment != "A" {
				continue
			}
			ret.Lines = append(ret.Lines, ReturnLine{
				BatchNumber:     int(ReadNum(line, 3, 7)),
				Sequence:        int(ReadNum(line, 8, 13)),
				OurNumber:       strings.TrimSpace(ReadString(line, 70, 90)),
				AmountCents:     ReadNum(line, 119, 134),
				OccurrenceCodes: strings.TrimSpace(ReadString(line, 230, 240)),
				Segment:         segment,
			})
		}
		ret.TotalLines++
	}
	return ret, nil
}

// OccurrenceVerdict maps an Itaú occurrence code to OK/REJECT/WARN using the
// SISPAG occurrence table. Unknown codes fall through to REJECT so that the
// caller always has a human-readable reason to surface to operators.
func OccurrenceVerdict(codes string) (verdict, reason string) {
	occ := LookupOccurrence(codes)
	if occ.Verdict == "OK" {
		return "OK", ""
	}
	return occ.Verdict, occ.Code + ": " + occ.Description
}
