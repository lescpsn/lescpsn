package libgo

import (
	"strconv"
)

func StoI(s string) (int, error) {
	if s == "" {
		return 0, nil
	}
	a, err := strconv.Atoi(s)
	return a, err
}

func StoB(s string) (bool, error) {
	if s == "true" {
		return true, nil
	}
	return false, nil
}

func StoI64(s string) (int64, error) {
	if s == "" {
		return 0, nil
	}
	a, err := strconv.ParseInt(s, 10, 64)
	return a, err
}

func ItoStr(i int) string {
	a := strconv.Itoa(i)
	return a
}
