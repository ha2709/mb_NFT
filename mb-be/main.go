package main

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/rs/cors"
)

type User struct {
	ID            int    `json:"id"`
	NRIC          string `json:"NRIC"`
	WalletAddress string `json:"wallet_address"`
}

type Receipt struct {
	Hash string `json:"hash"`
}

func main() {
	// Load environment variables from the .env file
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// Retrieve database connection parameters from environment variables
	dbUser := os.Getenv("DATABASE_USER")
	dbPassword := os.Getenv("DATABASE_PASSWORD")
	dbName := os.Getenv("DATABASE_NAME")
	dbHost := os.Getenv("DATABASE_HOST")
	dbPort := os.Getenv("DATABASE_PORT")

	// Construct the database connection string
	dbConnectionString := "user=" + dbUser + " password=" + dbPassword + " dbname=" + dbName + " host=" + dbHost + " port=" + dbPort

	// Connect to the database
	db, err := sql.Open("postgres", dbConnectionString)

	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Create the "users" table if it doesn't exist
	_, err = db.Exec("CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, NRIC TEXT, wallet_address TEXT)")

	if err != nil {
		log.Fatal(err)
	}

	// Create a router using Gorilla Mux
	router := mux.NewRouter()

	// Add the API version to the route paths
	apiV1 := router.PathPrefix("/api/v1").Subrouter()
	apiV1.HandleFunc("/users", getUsers(db)).Methods("GET")
	apiV1.HandleFunc("/users", createUser(db)).Methods("POST")
	// Set up CORS middleware
	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins: []string{"*"}, // Change this to your actual frontend origin in production
		AllowedMethods: []string{"GET", "POST"},
		AllowedHeaders: []string{"Content-Type"},
	})

	// Apply the CORS middleware to the router
	handler := corsMiddleware.Handler(jsonContentTypeMiddleware(router))

	// Start the HTTP server
	log.Fatal(http.ListenAndServe(":8000", handler))
}

func jsonContentTypeMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}

// Get all users
func getUsers(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query("SELECT * FROM users")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		users := []User{}
		for rows.Next() {
			var u User
			if err := rows.Scan(&u.ID, &u.NRIC, &u.WalletAddress); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			users = append(users, u)
		}
		if err := rows.Err(); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(users)
	}
}

func createUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var u User
		err := json.NewDecoder(r.Body).Decode(&u)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Check if the NRIC already exists in the database to enforce uniqueness.
		var existingID int
		err = db.QueryRow("SELECT id FROM users WHERE NRIC = $1", u.NRIC).Scan(&existingID)
		if err == nil {
			// NRIC already exists, return an error.
			http.Error(w, "NRIC already exists", http.StatusConflict)
			return
		} else if err != sql.ErrNoRows {
			// An unexpected error occurred during the query.
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		hash := hashUserData(u)

		// Insert the user into the database
		err = db.QueryRow("INSERT INTO users (NRIC, wallet_address) VALUES ($1, $2) RETURNING id", u.NRIC, u.WalletAddress).Scan(&u.ID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Respond with the hash as JSON
		receipt := Receipt{Hash: hash}
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(receipt)
	}
}

func hashUserData(user User) string {
	// Create a new SHA-256 hash
	hasher := sha256.New()

	// Hash the NRIC and wallet address
	hasher.Write([]byte(user.NRIC))
	hasher.Write([]byte(user.WalletAddress))

	// Get the hash sum as a hexadecimal string
	hashSum := hasher.Sum(nil)
	hash := hex.EncodeToString(hashSum)

	return hash
}
