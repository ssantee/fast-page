package main

import (
	"context"
	"fmt"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"time"
)

type DB interface {
	GetPage(ctx context.Context, p string, s string) (PageRecord, error)
	PutPage(ctx context.Context, cr CreatePageRequest) (UpdateResponse, error)
}

type DBImpl struct {
	svc       *dynamodb.Client
	tableName string
}

var ErrorDDBConnection = fmt.Errorf("failed connecting to dynamodb")
var ErrDDBAttributeMarshal = fmt.Errorf("failed to marshal attribute value")
var ErrNoResults = fmt.Errorf("no results found")
var ErrDDBPutItem = fmt.Errorf("failed to put item to ddb")

func NewDB(svc *dynamodb.Client, tableName string) DB {
	return DBImpl{
		svc:       svc,
		tableName: tableName,
	}
}

func (db DBImpl) GetPage(ctx context.Context, p string, s string) (PageRecord, error) {

	pk, err := attributevalue.Marshal(p)
	if err != nil {
		return PageRecord{}, fmt.Errorf("%w | could not marshal value \"%s\" | %w", ErrDDBAttributeMarshal, p, err)
	}
	sk, err := attributevalue.Marshal("PAGE#" + s)
	if err != nil {
		return PageRecord{}, fmt.Errorf("%w | could not marshal value \"%s\" | %w", ErrDDBAttributeMarshal, s, err)
	}

	r, err := svc.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(ddbTable),
		Key: map[string]types.AttributeValue{
			"UserID": pk,
			"SK":     sk,
		},
	})
	if err != nil {
		return PageRecord{}, fmt.Errorf("%w | failed to get item with err | %w", ErrorDDBConnection, err)
	}

	if r.Item == nil {
		return PageRecord{}, fmt.Errorf("%w | 0 | %w", ErrNoResults, err)
	}

	var pr PageRecord
	err = attributevalue.UnmarshalMap(r.Item, &pr)
	if err != nil {
		return PageRecord{}, fmt.Errorf("%w | could not marshal value item | %w", ErrDDBAttributeMarshal, err)
	}
	return pr, nil
}

func (db DBImpl) PutPage(ctx context.Context, cr CreatePageRequest) (UpdateResponse, error) {
	pr := PageRecord{
		PageName:  cr.Page,
		Links:     []LinkRecord{},
		CreatedAt: time.Now().Format(time.RFC3339),
		UpdatedAt: "",
	}

	prm, err := attributevalue.MarshalMap(pr)
	if err != nil {
		return UpdateResponse{}, fmt.Errorf("%w | could not marshal map from page record | %w", ErrDDBAttributeMarshal, err)
	}

	r, err := svc.PutItem(ctx, &dynamodb.PutItemInput{
		ReturnValues: "ALL_OLD",
		TableName:    aws.String(ddbTable),
		Item: map[string]types.AttributeValue{
			"UserID": &types.AttributeValueMemberS{
				Value: cr.UserId,
			},
			"SK": &types.AttributeValueMemberS{
				Value: "PAGE#" + cr.Page,
			},
			"Page": &types.AttributeValueMemberM{
				Value: prm,
			},
		},
	})

	if err != nil {
		return UpdateResponse{}, fmt.Errorf("%w | error | %w", ErrDDBPutItem, err)
	}

	var ur UpdateResponse
	err = attributevalue.UnmarshalMap(r.Attributes, &ur)

	if err != nil {
		return UpdateResponse{}, fmt.Errorf("%w | error | %w", ErrDDBAttributeMarshal, err)
	}

	return ur, nil
}
