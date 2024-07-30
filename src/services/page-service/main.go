package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-xray-sdk-go/instrumentation/awsv2"
	"log"
	"os"
	"regexp"
	"time"
)

var svc *dynamodb.Client
var ddbTable string
var db DBService

var errMessaging = map[int]string{
	400: "Bad Request",
	404: "No results found",
	500: "Internal Server Error",
}

var responseHeaders = map[string]string{"Content-Type": "application/json"}

var validationRules = map[string][]Rule{
	"page":       {{FieldName: "page", Required: true, MustMatch: regexp.MustCompile("^[a-zA-Z0-9\\-]*$")}},
	"userId":     {{FieldName: "userId", Required: true, MustMatch: regexp.MustCompile("^[a-zA-Z0-9\\-]*$")}},
	"templateId": {{FieldName: "templateId", Required: true, MustMatch: regexp.MustCompile("^[a-zA-Z0-9\\-]*$")}},
}

var getValidationRules = map[string][]Rule{
	"page":   validationRules["page"],
	"userId": validationRules["userId"],
}

var postValidationRules = map[string][]Rule{
	"page":       validationRules["page"],
	"userId":     validationRules["userId"],
	"templateId": validationRules["templateId"],
}

var getValidator ValidationService = NewValidator(getValidationRules)

var postValidator ValidationService = NewValidator(postValidationRules)

func handleGet(ctx context.Context, request events.APIGatewayProxyRequest, response *ClientResponse, responseCode *int, validator ValidationService) {
	qp := request.QueryStringParameters

	tv := map[string]string{"page": qp["page"], "userId": qp["userId"]}

	err := validator.Validate(tv)

	if err != nil {
		*responseCode = 400
		response.Message = fmt.Sprintf("%s | err: %s", errMessaging[*responseCode], err.Error())
		return
	}

	pr, err := db.GetPage(ctx, tv["page"], tv["userId"])

	if err != nil {
		if errors.Is(err, ErrNoResults) {
			*responseCode = 404
			response.Message = fmt.Sprintf("%s", errMessaging[*responseCode])
		} else {
			log.Printf("failed to get page, %v", err)
			*responseCode = 500
			response.Message = fmt.Sprintf("%s", errMessaging[*responseCode])
		}
		return
	}

	jRes, err := json.Marshal(pr)
	if err != nil {
		log.Printf("failed to marshal page, %v", err)
		return
	}
	response.Data = fmt.Sprintf("%s", jRes)
}

func handlePost(ctx context.Context, request events.APIGatewayProxyRequest, response *ClientResponse, responseCode *int, validator ValidationService) {

	var createReq CreatePageRequest
	err := json.Unmarshal([]byte(request.Body), &createReq)

	if err != nil {
		log.Printf("failed to unmarshal request body, %v", err)
		*responseCode = 400
		response.Message = fmt.Sprintf("%s", errMessaging[*responseCode])
		return
	}

	tv := map[string]string{"page": createReq.Page, "userId": createReq.UserId, "templateId": createReq.TemplateId}

	err = validator.Validate(tv)

	if err != nil {
		*responseCode = 400
		response.Message = fmt.Sprintf("%s | err: %s", errMessaging[*responseCode], err.Error())
		return
	}

	_, err = db.GetPage(ctx, createReq.Page, createReq.UserId)

	isNew := errors.Is(err, ErrNoResults)

	ur, err := db.PutPage(ctx, createReq, isNew)

	if err != nil {
		log.Printf("failed to put page, %v", err)
		*responseCode = 500
		response.Message = fmt.Sprintf("%s", errMessaging[*responseCode])
		return
	}

	var jRes []byte
	jRes, err = json.Marshal(ur.Page)
	response.Data = fmt.Sprintf("%s", jRes)
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	sourceIP := request.RequestContext.Identity.SourceIP
	log.Printf("RequestId: %s \nFromIpx: %s\n", request.RequestContext.RequestID, sourceIP)

	var response ClientResponse = ClientResponse{Message: ""}
	var responseCode int = 200

	switch request.HTTPMethod {
	case "GET":
		handleGet(ctx, request, &response, &responseCode, getValidator)
	case "POST":
		// create
		handlePost(ctx, request, &response, &responseCode, postValidator)

	case "PUT":
		response.Message = fmt.Sprintf("PUT: %s", "Hi")
		// update
	case "DELETE":
		response.Message = fmt.Sprintf("DELETE: %s", "Hi")
	}

	rJson, err := json.Marshal(response)
	if err != nil {
		log.Fatalf("failed to marshal response, %v", err)
	}

	return events.APIGatewayProxyResponse{
		Body:       string(rJson),
		Headers:    responseHeaders,
		StatusCode: responseCode,
	}, nil
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion("us-east-1"),
	)
	if err != nil {
		log.Fatalf("unable to load SDK config, %v", err)
	}

	awsv2.AWSV2Instrumentor(&cfg.APIOptions)

	svc = dynamodb.NewFromConfig(cfg)
	ddbTable = os.Getenv("TABLE_NAME")
	db = NewDB(svc, ddbTable)

	lambda.StartWithOptions(handler, lambda.WithContext(ctx))
}
