package rest

import "github.com/vanlink-ltda/paymentshub/internal/app/ports"

// Compile-time assertion: Client satisfies ports.PaymentGateway.
var _ ports.PaymentGateway = (*Client)(nil)
