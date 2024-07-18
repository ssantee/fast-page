package main

import (
	"context"
	"fmt"
	"os"
	"regexp"
	"strings"
	"testing"
)

func TestMain(m *testing.M) {
	fmt.Println("validator start tests")
	e := m.Run()
	fmt.Println("validator end tests")
	os.Exit(e)
}

func TestNewValidator(t *testing.T) {
	reg := regexp.MustCompile("^[a-zA-Z0-9\\-]*$")
	testCases := []struct {
		name              string
		rules             map[string][]Rule
		altRules          map[string][]Rule
		expectRulesLen    int
		expectAltRulesLen int
		expectedError     error
	}{
		{
			name: "new validator with 3 rules",
			rules: map[string][]Rule{
				"page":       {{FieldName: "page", Required: true, MustMatch: reg}},
				"userId":     {{FieldName: "userId", Required: true, MustMatch: reg}},
				"templateId": {{FieldName: "templateId", Required: true, MustMatch: reg}},
			},
			expectRulesLen: 3,
			altRules: map[string][]Rule{
				"page":       {{FieldName: "page", Required: true, MustMatch: reg}},
				"userId":     {{FieldName: "userId", Required: true, MustMatch: reg}},
				"templateId": {{FieldName: "templateId", Required: true, MustMatch: reg}},
				"someOther":  {{FieldName: "other", Required: true, MustMatch: reg}},
			},
			expectAltRulesLen: 4,
			expectedError:     nil,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			validator := NewValidator(testCase.rules)
			if validator == nil {
				t.Errorf("Expected validator to be created, but got nil")
			}
			if len(validator.(Validator).Rules) != testCase.expectRulesLen {
				t.Errorf("Expected validator to have %d rules, but got %d", testCase.expectRulesLen, len(validator.(Validator).Rules))
			}

			validatorx := NewValidator(testCase.altRules)
			if validatorx == nil {
				t.Errorf("Expected validator to be created, but got nil")
			}
			if len(validatorx.(Validator).Rules) != testCase.expectAltRulesLen {
				t.Errorf("Expected validator to have %d rules, but got %d", testCase.expectRulesLen, len(validatorx.(Validator).Rules))
			}
		})
	}
}

func TestValidatorImpl_AddRule(t *testing.T) {
	reg := regexp.MustCompile("^[a-zA-Z0-9\\-]*$")
	testCases := []struct {
		name               string
		rules              map[string][]Rule
		rule               Rule
		expectRulesLen     int
		expectRulesLenPost int
		expectedError      error
	}{
		{
			name: "TestAddRule",
			rules: map[string][]Rule{
				"page": {{FieldName: "page", Required: true, MustMatch: reg}},
			},
			rule:               Rule{FieldName: "someOther", Required: true, MustMatch: reg},
			expectRulesLen:     1,
			expectRulesLenPost: 2,
			expectedError:      nil,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			validator := NewValidator(testCase.rules)
			if len(validator.(Validator).Rules) != testCase.expectRulesLen {
				t.Errorf("Expected validator to have %d rules, but got %d", testCase.expectRulesLen, len(validator.(Validator).Rules))
			}
			validator.AddRule(map[string]Rule{"someOther": testCase.rule})
			if len(validator.(Validator).Rules) != testCase.expectRulesLenPost {
				t.Errorf("Expected validator to have %d rules, but got %d", testCase.expectRulesLenPost, len(validator.(Validator).Rules))
			}
		})
	}
}

func TestValidatorImpl_Validate(t *testing.T) {
	reg := regexp.MustCompile("^[a-zA-Z0-9\\-]*$")
	testCases := []struct {
		name          string
		rules         map[string][]Rule
		fields        map[string]string
		expectError   bool
		expectedError error
		exactError    bool
	}{
		{
			name: "valid values",
			rules: map[string][]Rule{
				"page":       {{FieldName: "page", Required: true, MustMatch: reg}},
				"userId":     {{FieldName: "userId", Required: true, MustMatch: reg}},
				"templateId": {{FieldName: "templateId", Required: true, MustMatch: reg}},
			},
			fields: map[string]string{
				"page":       "test1234",
				"userId":     "someUserId",
				"templateId": "someTemplateId9",
			},
			expectError:   false,
			expectedError: nil,
		},
		{
			name: "one invalid value",
			rules: map[string][]Rule{
				"page":       {{FieldName: "page", Required: true, MustMatch: reg}},
				"userId":     {{FieldName: "userId", Required: true, MustMatch: reg}},
				"templateId": {{FieldName: "templateId", Required: true, MustMatch: reg}},
			},
			fields: map[string]string{
				"page":       "test$",
				"userId":     "test",
				"templateId": "test",
			},
			expectError:   true,
			expectedError: &FieldError{Field: "page", Message: "field does not match required pattern"},
			exactError:    true,
		},
		{
			name: "required field missing",
			rules: map[string][]Rule{
				"page":       {{FieldName: "page", Required: true, MustMatch: reg}},
				"userId":     {{FieldName: "userId", Required: true, MustMatch: reg}},
				"templateId": {{FieldName: "templateId", Required: true, MustMatch: reg}},
			},
			fields: map[string]string{
				"page":       "test",
				"userId":     "",
				"templateId": "test",
			},
			expectError:   true,
			expectedError: &FieldError{Field: "userId", Message: "required field not provided | required fields"},
			exactError:    false,
		},
		{
			name: "extra field lacking rules",
			rules: map[string][]Rule{
				"page":       {{FieldName: "page", Required: true, MustMatch: reg}},
				"userId":     {{FieldName: "userId", Required: true, MustMatch: reg}},
				"templateId": {{FieldName: "templateId", Required: true, MustMatch: reg}},
			},
			fields: map[string]string{
				"page":       "test",
				"userId":     "test",
				"templateId": "test",
				"other":      "asdf",
			},
			expectError:   true,
			expectedError: &FieldError{Field: "other", Message: "no rules found for field"},
			exactError:    true,
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			validator := NewValidator(testCase.rules)
			err := validator.Validate(testCase.fields)
			if testCase.expectError {
				if err == nil {
					t.Errorf("Expected error, but got nil")
				} else {
					if testCase.exactError {
						if err.Error() != testCase.expectedError.Error() {
							t.Errorf("Expected error %v, but got %v", testCase.expectedError, err)
						}
					} else {
						if !strings.Contains(err.Error(), testCase.expectedError.Error()) {
							t.Errorf("Expected error to contain %v, but got %v", testCase.expectedError, err)
						}
					}
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error, but got %v", err)
				}
			}
		})
	}
}

func TestValidatorImpl_ValidateAll(t *testing.T) {
	reg := regexp.MustCompile("^[a-zA-Z0-9\\-]*$")
	testCases := []struct {
		name          string
		rules         map[string][]Rule
		fields        map[string]string
		expectError   bool
		expectedError error
		exactError    bool
		expectErrLen  int
	}{
		{
			name: "no errors expected",
			rules: map[string][]Rule{
				"page":       {{FieldName: "page", Required: true, MustMatch: reg}},
				"userId":     {{FieldName: "userId", Required: true, MustMatch: reg}},
				"templateId": {{FieldName: "templateId", Required: true, MustMatch: reg}},
			},
			fields: map[string]string{
				"page":       "test1234",
				"userId":     "someUserId",
				"templateId": "someTemplateId9",
			},
			expectError:   false,
			expectedError: nil,
			expectErrLen:  0,
		},
		{
			name: "one field error",
			rules: map[string][]Rule{
				"page":       {{FieldName: "page", Required: true, MustMatch: reg}},
				"userId":     {{FieldName: "userId", Required: true, MustMatch: reg}},
				"templateId": {{FieldName: "templateId", Required: true, MustMatch: reg}},
			},
			fields: map[string]string{
				"page":       "test$",
				"userId":     "test",
				"templateId": "test",
			},
			expectError:   true,
			expectedError: &FieldError{Field: "page", Message: "field does not match required pattern"},
			exactError:    true,
			expectErrLen:  1,
		},
		{
			name: "three field error",
			rules: map[string][]Rule{
				"page":       {{FieldName: "page", Required: true, MustMatch: reg}},
				"userId":     {{FieldName: "userId", Required: true, MustMatch: reg}},
				"templateId": {{FieldName: "templateId", Required: true, MustMatch: reg}},
			},
			fields: map[string]string{
				"page":       "test$",
				"userId":     "te+st",
				"templateId": "te>st",
			},
			expectError:   true,
			expectedError: &FieldError{Field: "page", Message: "field does not match required pattern"},
			exactError:    true,
			expectErrLen:  3,
		},
		{
			name: "missing required field",
			rules: map[string][]Rule{
				"page":       {{FieldName: "page", Required: true, MustMatch: reg}},
				"userId":     {{FieldName: "userId", Required: true, MustMatch: reg}},
				"templateId": {{FieldName: "templateId", Required: true, MustMatch: reg}},
			},
			fields: map[string]string{
				"page":       "test",
				"userId":     "",
				"templateId": "test",
			},
			expectError:   true,
			expectedError: &FieldError{Field: "userId", Message: "required field not provided | required fields"},
			exactError:    false,
			expectErrLen:  1,
		},
		{
			name: "one error (no rules)",
			rules: map[string][]Rule{
				"page":       {{FieldName: "page", Required: true, MustMatch: reg}},
				"userId":     {{FieldName: "userId", Required: true, MustMatch: reg}},
				"templateId": {{FieldName: "templateId", Required: true, MustMatch: reg}},
			},
			fields: map[string]string{
				"page":       "test",
				"userId":     "test",
				"templateId": "test",
				"other":      "asdf",
			},
			expectError:   true,
			expectedError: &FieldError{Field: "other", Message: "no rules found for field"},
			exactError:    true,
			expectErrLen:  1,
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			validator := NewValidator(testCase.rules)
			errs := validator.ValidateAll(testCase.fields)
			if testCase.expectError {
				if len(errs) == 0 {
					t.Errorf("Expected error, but got nil")
				} else {
					if len(errs) != testCase.expectErrLen {
						t.Errorf("Expected %d errors, but got %d", testCase.expectErrLen, len(errs))
					}
				}
			} else {
				if len(errs) > 0 {
					t.Errorf("Expected no error, but got %v", errs)
				}
			}
		})
	}
}

func TestValidatorImpl_LookupRulesForField(t *testing.T) {
	reg := regexp.MustCompile("^[a-zA-Z0-9\\-]*$")
	testCases := []struct {
		name               string
		rules              map[string][]Rule
		rule               Rule
		expectRulesLen     int
		expectRulesLenPost int
		expectedError      error
	}{
		{
			name: "TestLookupRulesForField",
			rules: map[string][]Rule{
				"page": {{FieldName: "page", Required: true, MustMatch: reg}},
			},
			rule:               Rule{FieldName: "page", Required: true, MustMatch: regexp.MustCompile("^[a-zA-Z0-9\\-_]*$")},
			expectRulesLen:     1,
			expectRulesLenPost: 2,
			expectedError:      nil,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			validator := NewValidator(testCase.rules)
			if validator == nil {
				t.Errorf("Expected validator to be created, but got nil")
			}
			r := validator.(Validator).LookupRulesForField("page")
			if len(r) != testCase.expectRulesLen {
				t.Errorf("Expected validator to have %d rules, but got %d", testCase.expectRulesLen, len(r))
			}
			validator.(Validator).AddRule(map[string]Rule{"page": testCase.rule})
			r = validator.(Validator).LookupRulesForField("page")
			if len(r) != testCase.expectRulesLenPost {
				t.Errorf("Expected validator to have %d rules, but got %d", testCase.expectRulesLenPost, len(r))
			}
		})
	}
}

func TestValidatorImpl_SanitizeInputValue(t *testing.T) {
	testCases := []struct {
		name     string
		value    string
		expected string
	}{
		{
			name:     "valid string unchanged",
			value:    "valid123",
			expected: "valid123",
		},
		{
			name:     "invalid string sanitized",
			value:    "<test>",
			expected: "*test*",
		},
		{
			name:     "invalid string sanitized 2",
			value:    "<#&U+\"'{}test>",
			expected: "********test*",
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			validator := NewValidator(map[string][]Rule{})
			if validator == nil {
				t.Errorf("Expected validator to be created, but got nil")
			}
			result := validator.(Validator).sanitizeInputValue(testCase.value)
			if result != testCase.expected {
				t.Errorf("Expected value to be %s, but got %s", testCase.expected, result)
			}
		})
	}

}

func TestRule_setRequired(t *testing.T) {
	reg := regexp.MustCompile("^[a-zA-Z0-9\\-]*$")
	testCases := []struct {
		name       string
		rule       Rule
		expectRule Rule
	}{
		{
			name:       "TestSetRequired",
			rule:       Rule{FieldName: "page", Required: false, MustMatch: reg},
			expectRule: Rule{FieldName: "page", Required: true, MustMatch: reg},
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			result := testCase.rule.setRequired(testCase.rule)
			if result.Required != testCase.expectRule.Required {
				t.Errorf("Expected Required to be %v, but got %v", testCase.expectRule.Required, result.Required)
			}
		})
	}
}

func TestRule_setNotRequired(t *testing.T) {
	reg := regexp.MustCompile("^[a-zA-Z0-9\\-]*$")
	testCases := []struct {
		name       string
		rule       Rule
		expectRule Rule
	}{
		{
			name:       "TestSetRequired",
			rule:       Rule{FieldName: "page", Required: true, MustMatch: reg},
			expectRule: Rule{FieldName: "page", Required: false, MustMatch: reg},
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			result := testCase.rule.setNotRequired(testCase.rule)
			if result.Required != testCase.expectRule.Required {
				t.Errorf("Expected Required to be %v, but got %v", testCase.expectRule.Required, result.Required)
			}
		})
	}
}

func BenchmarkValidatorImpl_Validate(b *testing.B) {
	reg := regexp.MustCompile("^[a-zA-Z0-9\\-]*$")
	rules := map[string][]Rule{
		"page":       {{FieldName: "page", Required: true, MustMatch: reg}},
		"userId":     {{FieldName: "userId", Required: true, MustMatch: reg}},
		"templateId": {{FieldName: "templateId", Required: true, MustMatch: reg}},
	}
	fields := map[string]string{
		"page":       "test",
		"userId":     "test",
		"templateId": "test",
	}
	validator := NewValidator(rules)
	for i := 0; i < b.N; i++ {
		err := validator.Validate(fields)
		if err != nil {
			b.Errorf("Expected no error, but got %v", err)
		}
	}
}

func BenchmarkValidatorImpl_ValidateAll(b *testing.B) {
	reg := regexp.MustCompile("^[a-zA-Z0-9\\-]*$")
	rules := map[string][]Rule{
		"page":       {{FieldName: "page", Required: true, MustMatch: reg}},
		"userId":     {{FieldName: "userId", Required: true, MustMatch: reg}},
		"templateId": {{FieldName: "templateId", Required: true, MustMatch: reg}},
	}
	fields := map[string]string{
		"page":       "test",
		"userId":     "test",
		"templateId": "test",
	}
	validator := NewValidator(rules)
	for i := 0; i < b.N; i++ {
		err := validator.ValidateAll(fields)
		if err != nil {
			b.Errorf("Expected no error, but got %v", err)
		}
	}
}

func BenchmarkValidatorImpl_ValidateAllGR(b *testing.B) {
	reg := regexp.MustCompile("^[a-zA-Z0-9\\-]*$")
	rules := map[string][]Rule{
		"page":       {{FieldName: "page", Required: true, MustMatch: reg}},
		"userId":     {{FieldName: "userId", Required: true, MustMatch: reg}},
		"templateId": {{FieldName: "templateId", Required: true, MustMatch: reg}},
	}
	fields := map[string]string{
		"page":       "test",
		"userId":     "test",
		"templateId": "test",
	}
	validator := NewValidator(rules)
	ctx, cancelFunc := context.WithCancel(context.Background())
	defer cancelFunc()
	for i := 0; i < b.N; i++ {
		err := validator.(Validator).ValidateAllGR(ctx, fields)
		if err != nil {
			b.Errorf("Expected no error, but got %v", err)
		}
	}
}
