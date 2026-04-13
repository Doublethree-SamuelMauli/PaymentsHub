package sftp_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/banks/itau/sftp"
)

func TestLocalFileTransfer_UploadDownloadList(t *testing.T) {
	dir := t.TempDir()
	ft := sftp.NewLocalFileTransfer(dir)
	ctx := context.Background()

	data := []byte("CNAB 240 file content here")
	require.NoError(t, ft.Upload(ctx, "remessa/2026-04-13/file001.rem", data))

	downloaded, err := ft.Download(ctx, "remessa/2026-04-13/file001.rem")
	require.NoError(t, err)
	require.Equal(t, data, downloaded)

	files, err := ft.List(ctx, "remessa/2026-04-13")
	require.NoError(t, err)
	require.Equal(t, []string{"file001.rem"}, files)
}

func TestLocalFileTransfer_ListEmpty(t *testing.T) {
	dir := t.TempDir()
	ft := sftp.NewLocalFileTransfer(dir)
	files, err := ft.List(context.Background(), "nonexistent")
	require.NoError(t, err)
	require.Empty(t, files)
}

func TestLocalFileTransfer_DownloadNotFound(t *testing.T) {
	dir := t.TempDir()
	ft := sftp.NewLocalFileTransfer(dir)
	_, err := ft.Download(context.Background(), "nope.txt")
	require.Error(t, err)
}
