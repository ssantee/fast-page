package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-xray-sdk-go/instrumentation/awsv2"
	"log"
	"os"
	"time"
)

var svc *dynamodb.Client
var ddbTable string
var db DB

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	sourceIP := request.RequestContext.Identity.SourceIP
	log.Printf("RequestId: %s \nFromIp: %s\n", request.RequestContext.RequestID, sourceIP)

	var response ClientResponse = ClientResponse{Body: ""}

	switch request.HTTPMethod {
	case "GET":
		qp := request.QueryStringParameters
		p := qp["page"]
		u := qp["userId"]
		log.Printf("Query Params: %v\n", qp)

		pr, err := db.GetPage(ctx, p, u)

		if err != nil {
			log.Fatalf("failed to get page, %v", err)
		}

		jRes, err := json.Marshal(pr)
		if err != nil {
			log.Fatalf("failed to marshal page, %v", err)
		}

		response.Body = fmt.Sprintf("%s", jRes)
	case "POST":
		// check if page exists prior.
		// alternately, use the same function
		// for create and update.

		// create
		var createReq CreatePageRequest
		err := json.Unmarshal([]byte(request.Body), &createReq)

		if err != nil {
			log.Fatalf("failed to unmarshal request body, %v", err)
		}

		ur, err := db.PutPage(ctx, createReq)

		if err != nil {
			log.Fatalf("failed to put page, %v", err)
		}

		var jRes []byte
		jRes, err = json.Marshal(ur.Page)
		response.Body = fmt.Sprintf("%s", jRes)

	case "PUT":
		response.Body = fmt.Sprintf("PUT: %s", "Hi")
		// update
	case "DELETE":
		response.Body = fmt.Sprintf("DELETE: %s", "Hi")
	}

	return events.APIGatewayProxyResponse{
		Body:       response.Body,
		Headers:    map[string]string{"Content-Type": "application/json"},
		StatusCode: 200,
	}, nil
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
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
