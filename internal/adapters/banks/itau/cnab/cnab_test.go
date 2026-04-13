package cnab_test

import (
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/itau/cnab"
)

func TestFields_PadLeftNum(t *testing.T) {
	require.Equal(t, "00123", cnab.PadLeftNum(123, 5))
	require.Equal(t, "123", cnab.PadLeftNum(123, 3))
	require.Equal(t, "23", cnab.PadLeftNum(123, 2))
	require.Equal(t, "00000", cnab.PadLeftNum(0, 5))
}

func TestFields_PadRightAlpha(t *testing.T) {
	require.Equal(t, "HELLO     ", cnab.PadRightAlpha("hello", 10))
	require.Equal(t, "ACME FORNECEDOR", cnab.PadRightAlpha("Acme Fornecedor", 15))
	require.Equal(t, "JOAO", cnab.PadRightAlpha("João", 4))
}

func TestFields_NormalizeAccents(t *testing.T) {
	result := cnab.PadRightAlpha("São José dos Campos", 30)
	require.Contains(t, result, "SAO JOSE DOS CAMPOS")
}

func TestEncoder_FullFile_LineWidths(t *testing.T) {
	enc := cnab.NewEncoder()
	now := time.Date(2026, 4, 13, 10, 30, 0, 0, time.UTC)

	fh := cnab.FileHeader{
		CompanyDoc:        "12345678000199",
		CompanyAgency:     "1234",
		CompanyAccount:    "567890",
		CompanyAccountDgt: "0",
		CompanyName:       "EMPRESA TESTE LTDA",
		CreatedAt:         now,
		FileSequence:      1,
		Convenio:          "CONV-001",
	}

	require.NoError(t, enc.WriteFileHeader(fh))
	require.NoError(t, enc.WriteBatchHeader(cnab.BatchHeader{
		BatchNumber: 1,
		Service:     cnab.ServicePagamentoFornecedores,
		Forma:       cnab.FormaTED,
		Layout:      "046",
		FileHeader:  fh,
		Purpose:     "PAGAMENTO FORNECEDORES",
	}))

	require.NoError(t, enc.WriteSegmentA(1, cnab.SegmentA{
		Sequence:        1,
		BankCode:        "033",
		Agency:          "0001",
		AgencyDigit:     "0",
		Account:         "123456",
		AccountDigit:    "7",
		BeneficiaryName: "FORNECEDOR XYZ LTDA",
		OwnerDoc:        "98765432000188",
		DocumentNumber:  "NF-001",
		PaymentDate:     now,
		AmountCents:     150000,
		OurNumber:       "NF-001",
	}))

	require.NoError(t, enc.WriteSegmentB(1, cnab.SegmentB{
		Sequence:       1,
		BeneficiaryDoc: "98765432000188",
		DocumentType:   "2",
		AddressLine:    "RUA DAS FLORES",
		AddressNumber:  "100",
		City:           "SAO PAULO",
		CEP:            "01234567",
		State:          "SP",
	}))

	require.NoError(t, enc.WriteBatchTrailer(cnab.BatchTrailer{
		BatchNumber: 1,
		RecordCount: 4,
		TotalCents:  150000,
	}))

	require.NoError(t, enc.WriteFileTrailer(cnab.FileTrailer{
		BatchCount:  1,
		RecordCount: 6,
	}))

	raw := enc.Bytes()
	lines := strings.Split(strings.TrimRight(string(raw), "\r\n"), "\r\n")
	require.Len(t, lines, 6, "file should have 6 lines")

	for i, line := range lines {
		require.Len(t, line, cnab.LineWidth,
			"line %d has width %d, expected %d", i+1, len(line), cnab.LineWidth)
	}

	// Verify record type markers
	require.Equal(t, byte('0'), lines[0][7], "file header")
	require.Equal(t, byte('1'), lines[1][7], "batch header")
	require.Equal(t, byte('3'), lines[2][7], "segment A")
	require.Equal(t, byte('3'), lines[3][7], "segment B")
	require.Equal(t, byte('5'), lines[4][7], "batch trailer")
	require.Equal(t, byte('9'), lines[5][7], "file trailer")

	// Verify bank code in all lines
	for i, line := range lines {
		require.Equal(t, "341", line[0:3], "line %d bank code", i+1)
	}
}

func TestDecoder_Roundtrip(t *testing.T) {
	enc := cnab.NewEncoder()
	now := time.Date(2026, 4, 13, 10, 30, 0, 0, time.UTC)

	fh := cnab.FileHeader{
		CompanyDoc:        "12345678000199",
		CompanyAgency:     "1234",
		CompanyAccount:    "567890",
		CompanyAccountDgt: "0",
		CompanyName:       "EMPRESA TESTE",
		CreatedAt:         now,
		FileSequence:      1,
		Convenio:          "CONV-001",
	}

	require.NoError(t, enc.WriteFileHeader(fh))
	require.NoError(t, enc.WriteBatchHeader(cnab.BatchHeader{
		BatchNumber: 1, Service: "20", Forma: "03", Layout: "046",
		FileHeader: fh, Purpose: "TED",
	}))

	for i := 0; i < 3; i++ {
		require.NoError(t, enc.WriteSegmentA(1, cnab.SegmentA{
			Sequence:        i + 1,
			BankCode:        "033",
			Agency:          "0001",
			Account:         "123456",
			AccountDigit:    "7",
			BeneficiaryName: "FORNECEDOR",
			OurNumber:       "PAY-" + cnab.PadLeftNum(int64(i+1), 3),
			PaymentDate:     now,
			AmountCents:     int64((i + 1) * 10000),
		}))
		require.NoError(t, enc.WriteSegmentB(1, cnab.SegmentB{
			Sequence:       i + 1,
			BeneficiaryDoc: "12345678000199",
			DocumentType:   "2",
			City:           "CURITIBA",
			State:          "PR",
		}))
	}

	require.NoError(t, enc.WriteBatchTrailer(cnab.BatchTrailer{
		BatchNumber: 1, RecordCount: 8, TotalCents: 60000,
	}))
	require.NoError(t, enc.WriteFileTrailer(cnab.FileTrailer{
		BatchCount: 1, RecordCount: 10,
	}))

	raw := enc.Bytes()

	// Decode
	ret, err := cnab.Decode(raw)
	require.NoError(t, err)
	require.Len(t, ret.Lines, 3, "should decode 3 segment-A lines")
	require.GreaterOrEqual(t, ret.TotalLines, 7, "at least header+trailer+3 segA + batch header/trailer")

	require.Equal(t, "PAY-001", ret.Lines[0].OurNumber)
	require.Equal(t, "PAY-002", ret.Lines[1].OurNumber)
	require.Equal(t, "PAY-003", ret.Lines[2].OurNumber)
	require.Equal(t, int64(10000), ret.Lines[0].AmountCents)
	require.Equal(t, int64(30000), ret.Lines[2].AmountCents)
}

func TestOccurrenceVerdict(t *testing.T) {
	v, r := cnab.OccurrenceVerdict("BD")
	require.Equal(t, "OK", v)
	require.Empty(t, r)

	v, r = cnab.OccurrenceVerdict("00")
	require.Equal(t, "OK", v)

	v, r = cnab.OccurrenceVerdict("AE")
	require.Equal(t, "REJECT", v)
	require.Contains(t, r, "AE")
}
