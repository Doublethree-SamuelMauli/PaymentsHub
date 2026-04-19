package cnab

import "strings"

// Occurrence is a single SISPAG return code reported by Itaú in the last
// 10 bytes (positions 231-240) of Segmento A/B lines in a retorno file.
type Occurrence struct {
	Code        string
	Description string
	Verdict     string // "OK" | "REJECT" | "WARN"
}

// sispagOccurrences is an authoritative subset of the SISPAG Itaú occurrence
// table (Manual Técnico SISPAG, Anexo II). Unknown codes default to REJECT so
// we never silently accept payments the bank flagged.
//
// BD/00 = credited successfully; AE/AI/AJ = pending; everything else is a
// reject with a human-readable reason the operator can triage.
var sispagOccurrences = map[string]Occurrence{
	"00": {Code: "00", Description: "Crédito efetuado", Verdict: "OK"},
	"BD": {Code: "BD", Description: "Pagamento liquidado", Verdict: "OK"},

	"AA": {Code: "AA", Description: "Controle inválido", Verdict: "REJECT"},
	"AE": {Code: "AE", Description: "Tipo de título inválido", Verdict: "REJECT"},
	"AI": {Code: "AI", Description: "Data de vencimento inválida", Verdict: "REJECT"},
	"AJ": {Code: "AJ", Description: "Data de pagamento inválida", Verdict: "REJECT"},
	"AB": {Code: "AB", Description: "Código do banco inválido", Verdict: "REJECT"},
	"AC": {Code: "AC", Description: "Agência/dígito verificador inválido", Verdict: "REJECT"},
	"AD": {Code: "AD", Description: "Conta corrente/dígito verificador inválido", Verdict: "REJECT"},
	"AF": {Code: "AF", Description: "Valor do lançamento inválido", Verdict: "REJECT"},
	"AG": {Code: "AG", Description: "Tipo/número de inscrição inválido", Verdict: "REJECT"},
	"AH": {Code: "AH", Description: "Agência/conta do favorecido encerrada", Verdict: "REJECT"},
	"AL": {Code: "AL", Description: "Forma de lançamento inválida", Verdict: "REJECT"},
	"AN": {Code: "AN", Description: "Data de pagamento inválida", Verdict: "REJECT"},
	"AO": {Code: "AO", Description: "Data inferior à data de geração", Verdict: "REJECT"},
	"AP": {Code: "AP", Description: "Dados do favorecido divergentes do cadastro", Verdict: "REJECT"},
	"AR": {Code: "AR", Description: "Favorecido deve aceitar o crédito (DOC/TED)", Verdict: "REJECT"},
	"AS": {Code: "AS", Description: "CEP inválido", Verdict: "REJECT"},
	"AT": {Code: "AT", Description: "UF inválida", Verdict: "REJECT"},
	"AU": {Code: "AU", Description: "Endereço incompatível", Verdict: "REJECT"},
	"AX": {Code: "AX", Description: "CPF/CNPJ inconsistente", Verdict: "REJECT"},
	"AY": {Code: "AY", Description: "Inscrição do favorecido inválida", Verdict: "REJECT"},
	"AZ": {Code: "AZ", Description: "Título já pago/cancelado", Verdict: "REJECT"},

	"BA": {Code: "BA", Description: "Cadastro do favorecido inexistente", Verdict: "REJECT"},
	"BB": {Code: "BB", Description: "Título não encontrado", Verdict: "REJECT"},
	"BC": {Code: "BC", Description: "Conta do pagador sem saldo", Verdict: "REJECT"},
	"BE": {Code: "BE", Description: "Limite operacional excedido", Verdict: "REJECT"},
	"BF": {Code: "BF", Description: "Conta pagadora encerrada", Verdict: "REJECT"},
	"BG": {Code: "BG", Description: "Conta pagadora bloqueada", Verdict: "REJECT"},
	"BH": {Code: "BH", Description: "Conta pagadora não liberada", Verdict: "REJECT"},
	"BI": {Code: "BI", Description: "Conta pagadora com saldo insuficiente", Verdict: "REJECT"},
	"BJ": {Code: "BJ", Description: "CPF/CNPJ pagador inválido", Verdict: "REJECT"},

	"CA": {Code: "CA", Description: "Cancelado pelo ordenante", Verdict: "REJECT"},
	"CB": {Code: "CB", Description: "Cancelado pelo banco", Verdict: "REJECT"},
	"CC": {Code: "CC", Description: "Sem autorização para débito em conta", Verdict: "REJECT"},
	"CD": {Code: "CD", Description: "Código de barras inválido", Verdict: "REJECT"},
	"CE": {Code: "CE", Description: "Pagamento já processado", Verdict: "REJECT"},
	"CF": {Code: "CF", Description: "PIX recusado pelo banco do favorecido", Verdict: "REJECT"},
	"CG": {Code: "CG", Description: "Chave PIX inexistente", Verdict: "REJECT"},
	"CH": {Code: "CH", Description: "Chave PIX incorreta/inválida", Verdict: "REJECT"},
	"CI": {Code: "CI", Description: "PIX indisponível / fora de horário", Verdict: "REJECT"},
}

// LookupOccurrence returns the structured metadata for an Itaú occurrence
// code. Codes we don't recognise are reported as REJECT with the raw code as
// description — preferring false rejects to false positives.
func LookupOccurrence(raw string) Occurrence {
	code := strings.TrimSpace(raw)
	if code == "" {
		return Occurrence{Code: "", Description: "sem código", Verdict: "OK"}
	}
	if occ, ok := sispagOccurrences[code]; ok {
		return occ
	}
	// Multi-code field: Itaú may pack up to 5 two-char codes. First non-OK wins.
	if len(code) > 2 && len(code)%2 == 0 {
		for i := 0; i < len(code); i += 2 {
			c := code[i : i+2]
			occ, ok := sispagOccurrences[c]
			if !ok {
				continue
			}
			if occ.Verdict != "OK" {
				return occ
			}
		}
		return Occurrence{Code: code, Description: "múltiplos códigos OK", Verdict: "OK"}
	}
	return Occurrence{Code: code, Description: "código desconhecido", Verdict: "REJECT"}
}
