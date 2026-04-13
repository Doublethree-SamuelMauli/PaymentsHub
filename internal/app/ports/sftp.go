package ports

import "context"

// FileTransfer abstracts upload/download/list of files to a remote storage
// (SFTP for CNAB, S3 for object store). Itaú SFTP and a fake implementation
// both satisfy this interface.
type FileTransfer interface {
	Upload(ctx context.Context, remotePath string, data []byte) error
	Download(ctx context.Context, remotePath string) ([]byte, error)
	List(ctx context.Context, remoteDir string) ([]string, error)
}
