// Package banks provides bank-specific connection validators.
// Each validator tests that credentials work against the bank's API
// before storing them as active.
package banks

import (
	"context"
	"crypto/tls"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/http/handlers"
)

// ─── Itaú (341) ───
// Auth: OAuth2 + mTLS certificate
// Test: POST /oauth/token with client_credentials grant

type ItauValidator struct{}

func (ItauValidator) BankCode() string { return "341" }

func (ItauValidator) Validate(ctx context.Context, creds handlers.BankCredentials) error {
	if creds.ClientID == "" || creds.ClientSecret == "" {
		return fmt.Errorf("client_id e client_secret do OAuth2 Itaú são obrigatórios")
	}
	if len(creds.CertPEM) == 0 || len(creds.KeyPEM) == 0 {
		return fmt.Errorf("certificado mTLS (.pem) e chave privada são obrigatórios para Itaú")
	}

	cert, err := tls.X509KeyPair(creds.CertPEM, creds.KeyPEM)
	if err != nil {
		return fmt.Errorf("certificado mTLS inválido: %v", err)
	}

	client := &http.Client{
		Timeout: 15 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{Certificates: []tls.Certificate{cert}},
		},
	}

	// Try OAuth2 token endpoint
	body := strings.NewReader("grant_type=client_credentials&client_id=" + creds.ClientID + "&client_secret=" + creds.ClientSecret)
	req, _ := http.NewRequestWithContext(ctx, "POST", "https://sts.itau.com.br/api/oauth/token", body)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("falha na conexão com Itaú: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 401 || resp.StatusCode == 403 {
		return fmt.Errorf("credenciais OAuth2 recusadas pelo Itaú (HTTP %d)", resp.StatusCode)
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("Itaú retornou HTTP %d — verifique as credenciais", resp.StatusCode)
	}
	return nil
}

// ─── Inter (077) ───
// Auth: OAuth2 + certificado A1 (PFX/PEM)
// Test: POST /oauth/v2/token

type InterValidator struct{}

func (InterValidator) BankCode() string { return "077" }

func (InterValidator) Validate(ctx context.Context, creds handlers.BankCredentials) error {
	if creds.ClientID == "" || creds.ClientSecret == "" {
		return fmt.Errorf("client_id e client_secret do Inter são obrigatórios")
	}
	if len(creds.CertPEM) == 0 || len(creds.KeyPEM) == 0 {
		return fmt.Errorf("certificado e chave privada (.pem) são obrigatórios para Inter")
	}

	cert, err := tls.X509KeyPair(creds.CertPEM, creds.KeyPEM)
	if err != nil {
		return fmt.Errorf("certificado inválido: %v", err)
	}

	client := &http.Client{
		Timeout: 15 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{Certificates: []tls.Certificate{cert}},
		},
	}

	body := strings.NewReader("grant_type=client_credentials&client_id=" + creds.ClientID + "&client_secret=" + creds.ClientSecret + "&scope=pagamento-pix.write pagamento-pix.read")
	req, _ := http.NewRequestWithContext(ctx, "POST", "https://cdpj.partners.bancointer.com.br/oauth/v2/token", body)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("falha na conexão com Inter: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 401 || resp.StatusCode == 403 {
		return fmt.Errorf("credenciais recusadas pelo Inter (HTTP %d)", resp.StatusCode)
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("Inter retornou HTTP %d", resp.StatusCode)
	}
	return nil
}

// ─── Bradesco (237) ───
// Auth: OAuth2 + certificado
// Test: POST /auth/server/v1.1/token

type BradescoValidator struct{}

func (BradescoValidator) BankCode() string { return "237" }

func (BradescoValidator) Validate(ctx context.Context, creds handlers.BankCredentials) error {
	if creds.ClientID == "" {
		return fmt.Errorf("client_id do Bradesco é obrigatório")
	}
	if len(creds.CertPEM) == 0 || len(creds.KeyPEM) == 0 {
		return fmt.Errorf("certificado e chave privada são obrigatórios para Bradesco")
	}

	cert, err := tls.X509KeyPair(creds.CertPEM, creds.KeyPEM)
	if err != nil {
		return fmt.Errorf("certificado inválido: %v", err)
	}

	client := &http.Client{
		Timeout: 15 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{Certificates: []tls.Certificate{cert}},
		},
	}

	body := strings.NewReader("grant_type=client_credentials")
	req, _ := http.NewRequestWithContext(ctx, "POST", "https://proxy.api.prebanco.com.br/auth/server/v1.1/token", body)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(creds.ClientID, creds.ClientSecret)

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("falha na conexão com Bradesco: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 401 || resp.StatusCode == 403 {
		return fmt.Errorf("credenciais recusadas pelo Bradesco (HTTP %d)", resp.StatusCode)
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("Bradesco retornou HTTP %d", resp.StatusCode)
	}
	return nil
}

// ─── Caixa (104) ───
// Auth: certificado digital + API key
// Test: SFTP connectivity (CNAB-based, not REST)

type CaixaValidator struct{}

func (CaixaValidator) BankCode() string { return "104" }

func (CaixaValidator) Validate(ctx context.Context, creds handlers.BankCredentials) error {
	if creds.APIKey == "" && (creds.ClientID == "") {
		return fmt.Errorf("API key ou client_id da Caixa é obrigatório")
	}
	if len(creds.CertPEM) == 0 {
		return fmt.Errorf("certificado digital é obrigatório para Caixa")
	}

	_, err := tls.X509KeyPair(creds.CertPEM, creds.KeyPEM)
	if err != nil {
		return fmt.Errorf("certificado inválido: %v", err)
	}

	// Caixa uses SFTP for CNAB — validate SFTP connection if provided
	if creds.SFTPHost != "" {
		// For now, just validate the cert parses. Full SFTP test would require
		// ssh.Dial which we'll add when the CNAB adapter for Caixa is built.
		if creds.SFTPUser == "" {
			return fmt.Errorf("sftp_user é obrigatório quando sftp_host é informado")
		}
	}

	return nil
}

// AllValidators returns all supported bank validators.
func AllValidators() []handlers.BankValidator {
	return []handlers.BankValidator{
		ItauValidator{},
		InterValidator{},
		BradescoValidator{},
		CaixaValidator{},
	}
}
