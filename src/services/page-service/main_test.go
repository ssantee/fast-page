package main

import (
	"testing"
	// "github.com/aws/aws-lambda-go/events"
)

func TestHandler(t *testing.T) {
	//testCases := []struct {
	//	name          string
	//	request       events.APIGatewayProxyRequest
	//	expectedBody  string
	//	expectedError error
	//}{
	//{
	//	name: "GET",
	//	request: events.APIGatewayProxyRequest{
	//		RequestContext: events.APIGatewayProxyRequestContext{
	//			Identity: events.APIGatewayRequestIdentity{
	//				SourceIP: "127.0.0.1",
	//			},
	//		},
	//		HTTPMethod: "GET",
	//		QueryStringParameters: map[string]string{
	//			"page":   "test",
	//			"userId": "test",
	//		},
	//	},
	//	expectedBody:  "{\"message\": \"No results found\"}",
	//	expectedError: nil,
	//},
	//{
	//	name: "POST",
	//	request: events.APIGatewayProxyRequest{
	//		RequestContext: events.APIGatewayProxyRequestContext{
	//			Identity: events.APIGatewayRequestIdentity{
	//				SourceIP: "127.0.0.1",
	//			},
	//		},
	//	},
	//	expectedBody:  "Hello, 127.0.0.1!\n",
	//	expectedError: nil,
	//},
	//}

	//for _, testCase := range testCases {
	//	t.Run(testCase.name, func(t *testing.T) {
	//		response, err := handler(context.TODO(), testCase.request)
	//		if !errors.Is(err, testCase.expectedError) {
	//			t.Errorf("Expected error %v, but got %v", testCase.expectedError, err)
	//		}
	//
	//		if response.Body != testCase.expectedBody {
	//			t.Errorf("Expected response %v, but got %v", testCase.expectedBody, response.Body)
	//		}
	//
	//		if response.StatusCode != 200 {
	//			t.Errorf("Expected status code 200, but got %v", response.StatusCode)
	//		}
	//	})
	//}
}
