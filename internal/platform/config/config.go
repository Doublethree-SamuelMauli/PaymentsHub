// Package config loads PaymentsHub configuration from the process environment.
//
// All environment variables are prefixed with PH_ to avoid collisions.
// Required variables fail fast on Load().
package config

import (
	"fmt"

	"github.com/kelseyhightower/envconfig"
)

// Config is the full runtime configuration for both cmd/api and cmd/worker.
// Fields added here must also be documented in README.md.
type Config struct {
	Env                    string `envconfig:"ENV" default:"dev"`
	LogLevel               string `envconfig:"LOG_LEVEL" default:"info"`
	HTTPAddr               string `envconfig:"HTTP_ADDR" default:":8080"`
	DatabaseURL            string `envconfig:"DATABASE_URL" required:"true"`
	ShutdownTimeoutSeconds int    `envconfig:"SHUTDOWN_TIMEOUT_SECONDS" default:"30"`
}

// Load reads environment variables with prefix PH_ into a Config.
// Returns an error if a required variable is missing or malformed.
func Load() (Config, error) {
	var cfg Config
	if err := envconfig.Process("PH", &cfg); err != nil {
		return Config{}, fmt.Errorf("config: %w", err)
	}
	return cfg, nil
}
