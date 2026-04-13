package cnab

import "time"

// ItauBankCode is hardcoded per SISPAG layout (banco 341).
const ItauBankCode = "341"

// Service codes (field "servico" in the lote header).
const (
	ServicePagamentoFornecedores = "20"
)

// Forma de lancamento codes. 03 = TED (DOC legacy alias).
const (
	FormaTED = "03"
)

// FileHeader represents the "registro 0" record that opens a CNAB 240 file.
type FileHeader struct {
	CompanyDoc         string    // CPF/CNPJ (14 digits max)
	CompanyAgency      string    // 5 digits
	CompanyAccount     string    // 12 digits
	CompanyAccountDgt  string    // 1 digit
	CompanyName        string    // 30 alphanumeric
	CreatedAt          time.Time // file generation date/time
	FileSequence       int       // sequential number for the day
	Convenio           string    // supplied by Itaú (up to 20 chars)
}

// BatchHeader represents the "registro 1" record that opens a lote.
type BatchHeader struct {
	BatchNumber int    // 1-based
	Service     string // e.g. "20"
	Forma       string // e.g. "03"
	Layout      string // "046" = credit in account
	FileHeader  FileHeader
	Purpose     string // e.g. "CREDITO"
}

// SegmentA holds the minimum fields needed to credit a beneficiary (TED).
type SegmentA struct {
	Sequence        int
	BankCode        string
	Agency          string
	AgencyDigit     string
	Account         string
	AccountDigit    string
	BeneficiaryName string
	OwnerDoc        string
	DocumentNumber  string    // "our number" — we use payment.ExternalID
	PaymentDate     time.Time
	AmountCents     int64
	OurNumber       string
}

// SegmentB holds beneficiary address + document details.
type SegmentB struct {
	Sequence        int
	BeneficiaryDoc  string
	DocumentType    string // "1"=CPF, "2"=CNPJ
	AddressLine     string
	AddressNumber   string
	Complement      string
	Neighborhood    string
	City            string
	CEP             string
	State           string
}

// BatchTrailer is "registro 5".
type BatchTrailer struct {
	BatchNumber int
	RecordCount int
	TotalCents  int64
}

// FileTrailer is "registro 9".
type FileTrailer struct {
	BatchCount  int
	RecordCount int
}
