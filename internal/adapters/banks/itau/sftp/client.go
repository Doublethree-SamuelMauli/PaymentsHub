// Package sftp provides an SFTP-based FileTransfer for Itaú CNAB file
// exchange. In production it connects to the Itaú SFTP endpoint with key-based
// auth; in tests and dev it can be swapped for FakeFileTransfer via the
// ports.FileTransfer interface.
package sftp

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/vanlink-ltda/paymentshub/internal/app/ports"
)

// LocalFileTransfer implements ports.FileTransfer using the local filesystem.
// Used for development and testing before a real SFTP server is available.
// Production adapter (using pkg/sftp) will be introduced during hardening.
type LocalFileTransfer struct {
	baseDir string
}

// NewLocalFileTransfer creates a local-disk transfer rooted at baseDir.
func NewLocalFileTransfer(baseDir string) *LocalFileTransfer {
	return &LocalFileTransfer{baseDir: baseDir}
}

var _ ports.FileTransfer = (*LocalFileTransfer)(nil)

func (l *LocalFileTransfer) Upload(_ context.Context, remotePath string, data []byte) error {
	full := filepath.Join(l.baseDir, remotePath)
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		return fmt.Errorf("mkdir: %w", err)
	}
	return os.WriteFile(full, data, 0o644)
}

func (l *LocalFileTransfer) Download(_ context.Context, remotePath string) ([]byte, error) {
	return os.ReadFile(filepath.Join(l.baseDir, remotePath))
}

func (l *LocalFileTransfer) List(_ context.Context, remoteDir string) ([]string, error) {
	entries, err := os.ReadDir(filepath.Join(l.baseDir, remoteDir))
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	names := make([]string, 0, len(entries))
	for _, e := range entries {
		if !e.IsDir() {
			names = append(names, e.Name())
		}
	}
	return names, nil
}
