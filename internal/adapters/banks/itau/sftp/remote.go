package sftp

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"path"
	"sync"
	"time"

	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"

	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
)

// RemoteConfig describes how to connect to a bank SFTP endpoint.
// Currently targets Itaú SISPAG, but the same shape works for any SFTP server.
type RemoteConfig struct {
	Host            string
	Port            int
	User            string
	PrivateKeyPEM   []byte
	Passphrase      []byte
	HostKeyFinger   string        // optional SHA-256 fingerprint of expected server host key
	DialTimeout     time.Duration
	SessionTimeout  time.Duration
	MaxRetries      int
	InitialBackoff  time.Duration
}

// RemoteFileTransfer talks to an SFTP server using a cached SSH session that
// is rebuilt on demand. It is safe for concurrent use.
type RemoteFileTransfer struct {
	cfg RemoteConfig

	mu     sync.Mutex
	ssh    *ssh.Client
	client *sftp.Client
}

// NewRemoteFileTransfer builds a production-ready SFTP client.
func NewRemoteFileTransfer(cfg RemoteConfig) (*RemoteFileTransfer, error) {
	if cfg.Host == "" || cfg.User == "" {
		return nil, errors.New("sftp: host and user are required")
	}
	if len(cfg.PrivateKeyPEM) == 0 {
		return nil, errors.New("sftp: private key required")
	}
	if cfg.Port == 0 {
		cfg.Port = 22
	}
	if cfg.DialTimeout == 0 {
		cfg.DialTimeout = 15 * time.Second
	}
	if cfg.SessionTimeout == 0 {
		cfg.SessionTimeout = 60 * time.Second
	}
	if cfg.MaxRetries == 0 {
		cfg.MaxRetries = 3
	}
	if cfg.InitialBackoff == 0 {
		cfg.InitialBackoff = 500 * time.Millisecond
	}
	return &RemoteFileTransfer{cfg: cfg}, nil
}

var _ ports.FileTransfer = (*RemoteFileTransfer)(nil)

// Close releases cached sessions. Call from shutdown hooks.
func (r *RemoteFileTransfer) Close() error {
	r.mu.Lock()
	defer r.mu.Unlock()
	var first error
	if r.client != nil {
		if err := r.client.Close(); err != nil {
			first = err
		}
		r.client = nil
	}
	if r.ssh != nil {
		if err := r.ssh.Close(); err != nil && first == nil {
			first = err
		}
		r.ssh = nil
	}
	return first
}

func (r *RemoteFileTransfer) session(ctx context.Context) (*sftp.Client, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.client != nil {
		// Best-effort liveness check: Getwd is cheap.
		if _, err := r.client.Getwd(); err == nil {
			return r.client, nil
		}
		_ = r.client.Close()
		r.client = nil
	}
	if r.ssh != nil {
		_ = r.ssh.Close()
		r.ssh = nil
	}

	signer, err := parseSigner(r.cfg.PrivateKeyPEM, r.cfg.Passphrase)
	if err != nil {
		return nil, fmt.Errorf("sftp: parse key: %w", err)
	}

	hostKeyCb := ssh.InsecureIgnoreHostKey()
	if r.cfg.HostKeyFinger != "" {
		hostKeyCb = fingerprintHostKey(r.cfg.HostKeyFinger)
	}

	clientCfg := &ssh.ClientConfig{
		User:            r.cfg.User,
		Auth:            []ssh.AuthMethod{ssh.PublicKeys(signer)},
		HostKeyCallback: hostKeyCb,
		Timeout:         r.cfg.DialTimeout,
	}

	addr := fmt.Sprintf("%s:%d", r.cfg.Host, r.cfg.Port)
	dialer := net.Dialer{Timeout: r.cfg.DialTimeout}
	netConn, err := dialer.DialContext(ctx, "tcp", addr)
	if err != nil {
		return nil, fmt.Errorf("sftp: dial %s: %w", addr, err)
	}
	sshConn, chans, reqs, err := ssh.NewClientConn(netConn, addr, clientCfg)
	if err != nil {
		_ = netConn.Close()
		return nil, fmt.Errorf("sftp: handshake: %w", err)
	}
	sshClient := ssh.NewClient(sshConn, chans, reqs)

	sftpClient, err := sftp.NewClient(sshClient)
	if err != nil {
		_ = sshClient.Close()
		return nil, fmt.Errorf("sftp: new client: %w", err)
	}

	r.ssh = sshClient
	r.client = sftpClient
	return sftpClient, nil
}

// Upload uploads data to remotePath, creating parent directories as needed.
func (r *RemoteFileTransfer) Upload(ctx context.Context, remotePath string, data []byte) error {
	return r.withRetry(ctx, "upload", func(cli *sftp.Client) error {
		dir := path.Dir(remotePath)
		if dir != "." && dir != "/" {
			if err := cli.MkdirAll(dir); err != nil {
				return fmt.Errorf("mkdir %s: %w", dir, err)
			}
		}
		f, err := cli.Create(remotePath)
		if err != nil {
			return fmt.Errorf("create %s: %w", remotePath, err)
		}
		defer f.Close()
		if _, err := io.Copy(f, bytes.NewReader(data)); err != nil {
			return fmt.Errorf("write %s: %w", remotePath, err)
		}
		return nil
	})
}

// Download retrieves the remote file into memory.
func (r *RemoteFileTransfer) Download(ctx context.Context, remotePath string) ([]byte, error) {
	var data []byte
	err := r.withRetry(ctx, "download", func(cli *sftp.Client) error {
		f, err := cli.Open(remotePath)
		if err != nil {
			if errors.Is(err, os.ErrNotExist) {
				return err
			}
			return fmt.Errorf("open %s: %w", remotePath, err)
		}
		defer f.Close()
		buf, err := io.ReadAll(f)
		if err != nil {
			return fmt.Errorf("read %s: %w", remotePath, err)
		}
		data = buf
		return nil
	})
	return data, err
}

// List returns file names (non-directories) in remoteDir.
func (r *RemoteFileTransfer) List(ctx context.Context, remoteDir string) ([]string, error) {
	var names []string
	err := r.withRetry(ctx, "list", func(cli *sftp.Client) error {
		entries, err := cli.ReadDir(remoteDir)
		if err != nil {
			if errors.Is(err, os.ErrNotExist) {
				names = nil
				return nil
			}
			return fmt.Errorf("readdir %s: %w", remoteDir, err)
		}
		names = names[:0]
		for _, e := range entries {
			if !e.IsDir() {
				names = append(names, e.Name())
			}
		}
		return nil
	})
	return names, err
}

func (r *RemoteFileTransfer) withRetry(ctx context.Context, op string, fn func(*sftp.Client) error) error {
	backoff := r.cfg.InitialBackoff
	var lastErr error
	for attempt := 0; attempt < r.cfg.MaxRetries; attempt++ {
		if attempt > 0 {
			select {
			case <-time.After(backoff):
			case <-ctx.Done():
				return ctx.Err()
			}
			backoff *= 2
			// Force reconnect on retry.
			_ = r.Close()
		}
		cli, err := r.session(ctx)
		if err != nil {
			lastErr = err
			continue
		}
		if err := fn(cli); err != nil {
			if errors.Is(err, os.ErrNotExist) {
				return err // do not retry missing file
			}
			lastErr = fmt.Errorf("%s: %w", op, err)
			continue
		}
		return nil
	}
	if lastErr == nil {
		lastErr = fmt.Errorf("sftp %s: exhausted retries", op)
	}
	return lastErr
}

func parseSigner(pemBytes, passphrase []byte) (ssh.Signer, error) {
	if len(passphrase) > 0 {
		return ssh.ParsePrivateKeyWithPassphrase(pemBytes, passphrase)
	}
	return ssh.ParsePrivateKey(pemBytes)
}

func fingerprintHostKey(expected string) ssh.HostKeyCallback {
	return func(_ string, _ net.Addr, key ssh.PublicKey) error {
		got := ssh.FingerprintSHA256(key)
		if got != expected {
			return fmt.Errorf("sftp: host key mismatch: expected %s got %s", expected, got)
		}
		return nil
	}
}
