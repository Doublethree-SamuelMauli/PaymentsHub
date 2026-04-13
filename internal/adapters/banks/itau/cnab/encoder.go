package cnab

import (
	"bytes"
	"fmt"
	"time"
)

// Encoder writes CNAB 240 remessa files segment by segment, ensuring every
// line is exactly 240 characters and newlines use CRLF.
type Encoder struct {
	buf *bytes.Buffer
}

// NewEncoder returns a fresh encoder.
func NewEncoder() *Encoder {
	return &Encoder{buf: new(bytes.Buffer)}
}

// Bytes returns the complete file contents.
func (e *Encoder) Bytes() []byte { return e.buf.Bytes() }

// writeLine appends a 240-char line with CRLF.
func (e *Encoder) writeLine(line string) error {
	if len(line) != LineWidth {
		return fmt.Errorf("cnab: line width %d != %d: %q", len(line), LineWidth, line)
	}
	e.buf.WriteString(line)
	e.buf.WriteString("\r\n")
	return nil
}

// WriteFileHeader writes registro 0.
func (e *Encoder) WriteFileHeader(h FileHeader) error {
	line := "" +
		ItauBankCode + // 001-003
		"0000" + // 004-007 lote
		"0" + // 008 tipo registro
		Blank(9) + // 009-017 uso Febraban
		"2" + // 018 tipo inscricao empresa (2=CNPJ)
		PadLeftNumStr(h.CompanyDoc, 14) + // 019-032
		PadRightAlpha(h.Convenio, 20) + // 033-052 convenio
		PadLeftNumStr(h.CompanyAgency, 5) + // 053-057 agencia
		" " + // 058 dígito agencia (space pra Itaú)
		PadLeftNumStr(h.CompanyAccount, 12) + // 059-070 conta
		PadRightAlpha(h.CompanyAccountDgt, 1) + // 071
		" " + // 072 dígito conta agencia
		PadRightAlpha(h.CompanyName, 30) + // 073-102
		PadRightAlpha("BANCO ITAU S.A.", 30) + // 103-132
		Blank(10) + // 133-142 uso Febraban
		"1" + // 143 codigo remessa/retorno (1=remessa)
		h.CreatedAt.Format("02012006") + // 144-151 data geracao
		h.CreatedAt.Format("150405") + // 152-157 hora geracao
		PadLeftNum(int64(h.FileSequence), 6) + // 158-163 numero sequencial arquivo
		"080" + // 164-166 versao layout arquivo (080)
		"00000" + // 167-171 densidade
		Blank(20) + // 172-191 uso banco
		Blank(20) + // 192-211 uso empresa
		Blank(29) // 212-240 uso Febraban
	return e.writeLine(line)
}

// WriteBatchHeader writes registro 1.
func (e *Encoder) WriteBatchHeader(h BatchHeader) error {
	fh := h.FileHeader
	line := "" +
		ItauBankCode + // 001-003
		PadLeftNum(int64(h.BatchNumber), 4) + // 004-007
		"1" + // 008 tipo registro (1=header lote)
		"C" + // 009 tipo operacao (C=credito)
		h.Service + // 010-011 tipo servico
		h.Forma + // 012-013 forma lancamento
		PadLeftNumStr(h.Layout, 3) + // 014-016 versao layout lote
		" " + // 017
		"2" + // 018 tipo inscricao empresa
		PadLeftNumStr(fh.CompanyDoc, 14) + // 019-032
		PadRightAlpha(fh.Convenio, 20) + // 033-052
		PadLeftNumStr(fh.CompanyAgency, 5) + // 053-057
		" " + // 058
		PadLeftNumStr(fh.CompanyAccount, 12) + // 059-070
		PadRightAlpha(fh.CompanyAccountDgt, 1) + // 071
		" " + // 072
		PadRightAlpha(fh.CompanyName, 30) + // 073-102
		PadRightAlpha(h.Purpose, 40) + // 103-142 finalidade do lote
		PadRightAlpha("", 30) + // 143-172 endereco empresa
		PadLeftNumStr("", 5) + // 173-177 numero
		PadRightAlpha("", 15) + // 178-192 complemento
		PadRightAlpha("", 20) + // 193-212 cidade
		PadRightAlpha("", 5) + // 213-217 cep
		PadRightAlpha("", 3) + // 218-220 complemento cep
		PadRightAlpha("", 2) + // 221-222 estado
		Blank(8) + // 223-230 uso Febraban
		Blank(10) // 231-240 ocorrencia
	return e.writeLine(line)
}

// WriteSegmentA writes a "registro 3 A" row for a beneficiary credit.
func (e *Encoder) WriteSegmentA(batchNumber int, seg SegmentA) error {
	line := "" +
		ItauBankCode + // 001-003
		PadLeftNum(int64(batchNumber), 4) + // 004-007
		"3" + // 008 tipo registro
		PadLeftNum(int64(seg.Sequence), 5) + // 009-013
		"A" + // 014 codigo segmento
		"000" + // 015-017 tipo movimento (000 = inclusao)
		PadLeftNumStr(seg.BankCode, 3) + // 018-020
		PadLeftNumStr(seg.Agency, 5) + // 021-025
		" " + // 026 dígito agencia
		PadLeftNumStr(seg.Account, 12) + // 027-038
		PadRightAlpha(seg.AccountDigit, 1) + // 039
		" " + // 040 dígito agencia/conta
		PadRightAlpha(seg.BeneficiaryName, 30) + // 041-070
		PadRightAlpha(seg.OurNumber, 20) + // 071-090 seu numero (external_id)
		seg.PaymentDate.Format("02012006") + // 091-098 data pagamento
		"BRL" + // 099-101 moeda
		"000" + // 102-104 uso Febraban
		"000000000000000" + // 105-119 quantidade moeda
		PadLeftNum(seg.AmountCents, 15) + // 120-134 valor pagamento
		PadRightAlpha("", 15) + // 135-149 nosso numero
		PadRightAlpha("", 15) + // 150-164 uso Febraban
		"        " + // 165-172 data efetiva (8 spaces)
		"000000000000000" + // 173-187 valor efetivo
		PadRightAlpha("", 40) + // 188-227 outras informacoes
		PadRightAlpha("", 2) + // 228-229 finalidade DOC
		PadRightAlpha("", 5) + // 230-234 finalidade TED
		Blank(5) + // 235-239 complemento finalidade
		" " // 240
	return e.writeLine(line)
}

// WriteSegmentB writes a "registro 3 B" row for beneficiary address details.
func (e *Encoder) WriteSegmentB(batchNumber int, seg SegmentB) error {
	line := "" +
		ItauBankCode + // 001-003
		PadLeftNum(int64(batchNumber), 4) + // 004-007
		"3" + // 008
		PadLeftNum(int64(seg.Sequence), 5) + // 009-013
		"B" + // 014
		Blank(3) + // 015-017
		seg.DocumentType + // 018 tipo inscricao
		PadLeftNumStr(seg.BeneficiaryDoc, 14) + // 019-032
		PadRightAlpha(seg.AddressLine, 30) + // 033-062
		PadLeftNumStr(seg.AddressNumber, 5) + // 063-067
		PadRightAlpha(seg.Complement, 15) + // 068-082
		PadRightAlpha(seg.Neighborhood, 15) + // 083-097
		PadRightAlpha(seg.City, 20) + // 098-117
		PadLeftNumStr(seg.CEP, 5) + // 118-122
		PadRightAlpha("", 3) + // 123-125 complemento cep
		PadRightAlpha(seg.State, 2) + // 126-127
		"00000000" + // 128-135 data vencimento
		"000000000000000" + // 136-150 valor documento
		"000000000000000" + // 151-165 valor abatimento
		"000000000000000" + // 166-180 valor desconto
		"000000000000000" + // 181-195 valor mora
		"000000000000000" + // 196-210 valor multa
		PadRightAlpha("", 15) + // 211-225 codigo documento
		Blank(15) // 226-240 uso Febraban
	return e.writeLine(line)
}

// WriteBatchTrailer writes registro 5.
func (e *Encoder) WriteBatchTrailer(t BatchTrailer) error {
	line := "" +
		ItauBankCode + // 001-003
		PadLeftNum(int64(t.BatchNumber), 4) + // 004-007
		"5" + // 008
		Blank(9) + // 009-017
		PadLeftNum(int64(t.RecordCount), 6) + // 018-023 qtde registros lote
		PadLeftNum(t.TotalCents, 18) + // 024-041 valor total
		"000000000000000000" + // 042-059 qtde moedas
		"000000" + // 060-065 numero aviso
		Blank(165) + // 066-230
		Blank(10) // 231-240 ocorrencia
	return e.writeLine(line)
}

// WriteFileTrailer writes registro 9.
func (e *Encoder) WriteFileTrailer(t FileTrailer) error {
	line := "" +
		ItauBankCode + // 001-003
		"9999" + // 004-007
		"9" + // 008
		Blank(9) + // 009-017
		PadLeftNum(int64(t.BatchCount), 6) + // 018-023
		PadLeftNum(int64(t.RecordCount), 6) + // 024-029
		"000000" + // 030-035 qtde contas conciliacao
		Blank(205) // 036-240
	return e.writeLine(line)
}

// FormattedNow is a helper used in tests and producers.
func FormattedNow() time.Time { return time.Now() }
