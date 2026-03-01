package models

type TelemetryPayload struct {
	SessionID     string        `json:"sessionId"`
	UserID        string        `json:"userId"`
	Events        []interface{} `json:"events"`
	DurationSoFar int64         `json:"durationSoFar"`
}
