package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"github.com/vanlink-ltda/paymentshub/internal/adapters/db/dbgen"
	mw "github.com/vanlink-ltda/paymentshub/internal/adapters/http/middleware"
)

type AuthHandler struct {
	q      *dbgen.Queries
	pool   *pgxpool.Pool
	secret []byte
}

func NewAuthHandler(pool *pgxpool.Pool) *AuthHandler {
	secret := os.Getenv("PH_JWT_SECRET")
	if secret == "" {
		secret = "paymentshub-dev-secret-change-in-production"
	}
	return &AuthHandler{q: dbgen.New(pool), pool: pool, secret: []byte(secret)}
}

func (h *AuthHandler) Register(r chi.Router) {
	r.Post("/v1/auth/login", h.Login)
	r.With(mw.JWTAuth(h.secret)).Get("/v1/auth/me", h.Me)
	r.With(mw.JWTAuth(h.secret)).Post("/v1/auth/logout", h.Logout)
}

type loginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginResp struct {
	Token string      `json:"token"`
	User  userPayload `json:"user"`
}

type userPayload struct {
	ID       string  `json:"id"`
	Email    string  `json:"email"`
	Name     string  `json:"name"`
	Role     string  `json:"role"`
	ClientID *string `json:"client_id,omitempty"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json", nil)
		return
	}
	if req.Email == "" || req.Password == "" {
		writeJSONError(w, http.StatusBadRequest, "email and password required", nil)
		return
	}

	user, err := h.q.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeJSONError(w, http.StatusUnauthorized, "invalid credentials", nil)
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "auth failed", nil)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		writeJSONError(w, http.StatusUnauthorized, "invalid credentials", nil)
		return
	}

	_ = h.q.TouchUserLogin(r.Context(), user.ID)

	uid := uuid.UUID(user.ID.Bytes).String()
	var clientIDStr *string
	if user.ClientID.Valid {
		s := uuid.UUID(user.ClientID.Bytes).String()
		clientIDStr = &s
	}

	// Build JWT with claims
	claims := jwt.MapClaims{
		"sub":   uid,
		"email": user.Email,
		"name":  user.Name,
		"role":  user.Role,
		"exp":   time.Now().Add(8 * time.Hour).Unix(),
		"iat":   time.Now().Unix(),
	}
	if clientIDStr != nil {
		claims["client_id"] = *clientIDStr
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(h.secret)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "token error", nil)
		return
	}

	writeJSON(w, http.StatusOK, loginResp{
		Token: signed,
		User:  userPayload{ID: uid, Email: user.Email, Name: user.Name, Role: user.Role, ClientID: clientIDStr},
	})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims := mw.JWTClaimsFromContext(r.Context())
	if claims == nil {
		writeJSONError(w, http.StatusUnauthorized, "not authenticated", nil)
		return
	}
	clientID, _ := claims["client_id"].(string)
	var clientIDPtr *string
	if clientID != "" {
		clientIDPtr = &clientID
	}
	writeJSON(w, http.StatusOK, userPayload{
		ID:       claimsStr(claims, "sub"),
		Email:    claimsStr(claims, "email"),
		Name:     claimsStr(claims, "name"),
		Role:     claimsStr(claims, "role"),
		ClientID: clientIDPtr,
	})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, _ *http.Request) {
	// Stateless JWT: client discards token. In future, add revocation list.
	w.WriteHeader(http.StatusNoContent)
}

func claimsStr(claims jwt.MapClaims, key string) string {
	if v, ok := claims[key].(string); ok {
		return v
	}
	return ""
}

// ----- User management (admin only) -----

type UsersHandler struct {
	q    *dbgen.Queries
	pool *pgxpool.Pool
}

func NewUsersHandler(pool *pgxpool.Pool) *UsersHandler {
	return &UsersHandler{q: dbgen.New(pool), pool: pool}
}

func (h *UsersHandler) Register(r chi.Router) {
	r.Route("/v1/users", func(r chi.Router) {
		r.Use(mw.RequireRole("admin"))
		r.Get("/", h.List)
		r.Post("/", h.Create)
		r.Patch("/{id}/role", h.UpdateRole)
		r.Post("/{id}/deactivate", h.Deactivate)
		r.Post("/{id}/reset-password", h.ResetPassword)
	})
}

func (h *UsersHandler) List(w http.ResponseWriter, r *http.Request) {
	tenant := mw.TenantFromContext(r.Context())
	var users []dbgen.User
	var err error
	if tenant == uuid.Nil {
		users, err = h.q.ListAllUsers(r.Context())
	} else {
		users, err = h.q.ListUsersByClient(r.Context(), pgtype.UUID{Bytes: tenant, Valid: true})
	}
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "list users", nil)
		return
	}
	out := make([]map[string]any, 0, len(users))
	for _, u := range users {
		out = append(out, map[string]any{
			"id":            uuid.UUID(u.ID.Bytes).String(),
			"email":         u.Email,
			"name":          u.Name,
			"role":          u.Role,
			"active":        u.Active,
			"last_login_at": u.LastLoginAt.Time,
			"created_at":    u.CreatedAt.Time,
		})
	}
	writeJSON(w, http.StatusOK, out)
}

type createUserReq struct {
	Email    string `json:"email"`
	Name     string `json:"name"`
	Role     string `json:"role"`
	Password string `json:"password"`
}

func (h *UsersHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createUserReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json", nil)
		return
	}
	if req.Email == "" || req.Name == "" || req.Password == "" {
		writeJSONError(w, http.StatusBadRequest, "email, name, password required", nil)
		return
	}
	if req.Role == "" {
		req.Role = "viewer"
	}
	validRoles := map[string]bool{"admin": true, "approver": true, "operator": true, "viewer": true}
	if !validRoles[req.Role] {
		writeJSONError(w, http.StatusBadRequest, "invalid role", nil)
		return
	}
	if len(req.Password) < 8 {
		writeJSONError(w, http.StatusBadRequest, "password must be at least 8 chars", nil)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "hash error", nil)
		return
	}

	tenant := mw.TenantFromContext(r.Context())
	var clientPG pgtype.UUID
	if tenant != uuid.Nil {
		clientPG = pgtype.UUID{Bytes: tenant, Valid: true}
	}

	id := uuid.New()
	_, err = h.q.InsertUser(r.Context(), dbgen.InsertUserParams{
		ID:           pgtype.UUID{Bytes: id, Valid: true},
		ClientID:     clientPG,
		Email:        req.Email,
		PasswordHash: string(hash),
		Name:         req.Name,
		Role:         req.Role,
		Active:       true,
	})
	if err != nil {
		writeJSONError(w, http.StatusConflict, "user already exists or invalid", map[string]any{"detail": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{
		"id":    id.String(),
		"email": req.Email,
		"name":  req.Name,
		"role":  req.Role,
	})
}

type updateRoleReq struct{ Role string `json:"role"` }

func (h *UsersHandler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid id", nil)
		return
	}
	var req updateRoleReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json", nil)
		return
	}
	validRoles := map[string]bool{"admin": true, "approver": true, "operator": true, "viewer": true}
	if !validRoles[req.Role] {
		writeJSONError(w, http.StatusBadRequest, "invalid role", nil)
		return
	}
	if err := h.q.UpdateUserRole(r.Context(), dbgen.UpdateUserRoleParams{
		ID:   pgtype.UUID{Bytes: id, Valid: true},
		Role: req.Role,
	}); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "update failed", nil)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *UsersHandler) Deactivate(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid id", nil)
		return
	}
	if err := h.q.SetUserActive(r.Context(), dbgen.SetUserActiveParams{
		ID:     pgtype.UUID{Bytes: id, Valid: true},
		Active: false,
	}); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "deactivate failed", nil)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type resetPasswordReq struct{ Password string `json:"password"` }

func (h *UsersHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid id", nil)
		return
	}
	var req resetPasswordReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json", nil)
		return
	}
	if len(req.Password) < 8 {
		writeJSONError(w, http.StatusBadRequest, "password must be at least 8 chars", nil)
		return
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err := h.q.UpdateUserPassword(r.Context(), dbgen.UpdateUserPasswordParams{
		ID:           pgtype.UUID{Bytes: id, Valid: true},
		PasswordHash: string(hash),
	}); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "reset failed", nil)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
