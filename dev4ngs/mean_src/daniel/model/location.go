package model

type Location struct {
	Country  string `json:"country"`
	State    string `json:"state"`
	City     string `json:"city"`
	District string `json:"district"`
}
