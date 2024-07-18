package main

import (
	"context"
	"fmt"
	"log"
	"regexp"
	"slices"
	"strings"
	"sync"
)

// Rule is a struct to define validation rules
type Rule struct {
	FieldName      string
	Required       bool
	MustMatch      *regexp.Regexp
	RequestMethods []string
}

// setRequired sets the Required field of a Rule to true
func (r Rule) setRequired(ru Rule) Rule {
	ru.Required = true
	return ru
}

// setNotRequired sets the Required field of a Rule to false
func (r Rule) setNotRequired(ru Rule) Rule {
	ru.Required = false
	return ru
}

// FieldError is a custom error type for validation errors
type FieldError struct {
	Field     string
	Message   string
	Condition string
}

func (e *FieldError) Error() string {
	return e.Message
}

// validatorMessaging is a map of error messages for validation errors
var validatorMessaging = map[string]string{
	"requiredFieldMissing": "required field not provided",
	"fieldPatternMismatch": "field does not match required pattern",
}

// ValidationService is an interface to encapsulate the validation methods
type ValidationService interface {
	Validate(map[string]string) error
	ValidateAll(map[string]string) []error
	AddRule(ruleConfig map[string]Rule)
}

// Validator is a concrete implementation of the ValidationService interface
type Validator struct {
	Rules map[string][]Rule
}

// NewValidator creates a new ValidationService with specified Rules
func NewValidator(rules map[string][]Rule) ValidationService {
	return Validator{Rules: rules}
}

// Validate validates fields against the rules provided at initialization.
// Validate returns the first validation error encountered.
func (v Validator) Validate(fields map[string]string) error {
	for k, fVal := range fields {
		fv := v.sanitizeInputValue(strings.TrimSpace(fVal))
		fr := v.LookupRulesForField(k)
		if len(fr) == 0 {
			return &FieldError{Field: k, Message: "no rules found for field"}
		}
		var fe *FieldError
		for _, r := range fr {
			if r.Required && fv == "" {
				fe = &FieldError{Field: k, Message: fmt.Sprintf("%s | required fields: %s", validatorMessaging["requiredFieldMissing"], strings.Join(v.ListRequiredFields(), ", "))}
			}
			if r.MustMatch != nil && !r.MustMatch.MatchString(fv) {
				fe = &FieldError{Field: k, Message: validatorMessaging["fieldPatternMismatch"]}
			}
			if fe != nil {
				log.Printf("validator fail field [%s] with value [%s]", k, fv)
				return fe
			}
		}
	}
	return nil
}

// ValidateAll validates fields against the rules provided at initialization.
// ValidateAll returns all validation errors.
func (v Validator) ValidateAll(fields map[string]string) []error {
	var o []error
	for k, fVal := range fields {
		fv := v.sanitizeInputValue(strings.TrimSpace(fVal))
		fr := v.LookupRulesForField(k)
		if len(fr) == 0 {
			o = append(o, &FieldError{Field: k, Message: "no rules found for field"})
			continue
		}
		var fe *FieldError
		for _, r := range fr {
			if r.Required && fv == "" {
				fe = &FieldError{Field: k, Message: fmt.Sprintf("%s | required fields: %s", validatorMessaging["requiredFieldMissing"], strings.Join(v.ListRequiredFields(), ", "))}
			}
			if r.MustMatch != nil && !r.MustMatch.MatchString(fv) {
				fe = &FieldError{Field: k, Message: validatorMessaging["fieldPatternMismatch"]}
			}
			if fe != nil {
				log.Printf("validator fail field [%s] with value [%s]", k, fv)
				o = append(o, fe)
			}
		}
	}
	return o
}

// ValidateAllGR validates fields against the rules provided at initialization.
// ValidateAllGR returns all validation errors.
// Experimental to measure relative performance with goroutines.
// Not recommended for use.
func (v Validator) ValidateAllGR(ctx context.Context, fields map[string]string) []error {
	var wg sync.WaitGroup
	sfe := make([]error, len(fields))
	i := 0
	for k, fVal := range fields {
		wg.Add(1)
		go func(k, fVal string, i int) {
			defer wg.Done()
			fe := v.validateField(k, fVal)
			sfe[i] = fe
		}(k, fVal, i)
		i++
	}
	wg.Wait()
	var r []error
	for _, v := range sfe {
		if v != nil {
			r = append(r, v)
		}
	}

	return r
}

func (v Validator) validateField(k string, fVal string) error {
	fv := v.sanitizeInputValue(strings.TrimSpace(fVal))
	fr := v.LookupRulesForField(k)
	if len(fr) == 0 {
		log.Printf("validator fail field [%s] with value [%s]", k, fv)
		return &FieldError{Field: k, Message: "no rules found for field"}
	}
	var fe *FieldError
	for _, r := range fr {
		if r.Required && fv == "" {
			fe = &FieldError{Field: k, Message: fmt.Sprintf("%s | required fields: %s", validatorMessaging["requiredFieldMissing"], strings.Join(v.ListRequiredFields(), ", "))}
		}
		if r.MustMatch != nil && !r.MustMatch.MatchString(fv) {
			fe = &FieldError{Field: k, Message: validatorMessaging["fieldPatternMismatch"]}
		}
		if fe != nil {
			return fe
		}
	}
	return nil
}

// ListRequiredFields returns a list of required fields per the Rules
// provided at initialization.
func (v Validator) ListRequiredFields() (requiredFields []string) {
	for _, v := range v.Rules {
		for _, r := range v {
			if r.Required {
				requiredFields = append(requiredFields, r.FieldName)
			}
		}
	}
	slices.Sort(requiredFields)
	return
}

// AddRule adds a rule to the ValidationService
func (v Validator) AddRule(ruleConfig map[string]Rule) {
	for k, val := range ruleConfig {
		v.Rules[k] = append(v.Rules[k], val)
	}
}

// LookupRulesForField returns the rules for a given field name
func (v Validator) LookupRulesForField(fieldName string) []Rule {
	if _, ok := v.Rules[fieldName]; ok {
		return v.Rules[fieldName]
	}

	return []Rule{}
}

func (v Validator) GetAllRules() map[string][]Rule {
	return v.Rules
}

// sanitizeInputValue removes unwanted characters from a string.
// Use to clean any simple user-provided input before logging, storing, or reflecting.
// Will break HTML.
func (v Validator) sanitizeInputValue(value string) (out string) {
	ph := "*" // placeholder for easy recognition that string was modified
	r := strings.NewReplacer(
		"<", ph,
		">", ph,
		"#", ph,
		"&", ph,
		"U+", ph,
		"\"", ph,
		"'", ph,
		"{", ph,
		"}", ph)
	out = r.Replace(value)
	return
}
