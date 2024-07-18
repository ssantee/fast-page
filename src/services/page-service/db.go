package main

import (
	"context"
	"fmt"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"log"
	"time"
)

type DBService interface {
	GetPage(ctx context.Context, p string, s string) (PageRecord, error)
	PutPage(ctx context.Context, cr CreatePageRequest, isCreate bool) (UpdateResponse, error)
	CreatePage(ctx context.Context, cr CreatePageRequest) (UpdateResponse, error)
	UpdatePage(ctx context.Context, cr CreatePageRequest) (UpdateResponse, error)
}

type DB struct {
	svc       *dynamodb.Client
	tableName string
}

var ErrorDDBConnection = fmt.Errorf("failed connecting to dynamodb")
var ErrDDBAttributeMarshal = fmt.Errorf("failed to marshal attribute value")
var ErrNoResults = fmt.Errorf("no results found")
var ErrDDBPutItem = fmt.Errorf("failed to put item to ddb")

var skPrefixes = map[string]string{
	"page": "PAGE#",
}

func NewDB(svc *dynamodb.Client, tableName string) DBService {
	return DB{
		svc:       svc,
		tableName: tableName,
	}
}

func (db DB) GetPage(ctx context.Context, p string, s string) (PageRecord, error) {

	pk, err := attributevalue.Marshal(s)
	if err != nil {
		return PageRecord{}, fmt.Errorf("%w | could not marshal value \"%s\" | %w", ErrDDBAttributeMarshal, p, err)
	}
	sk, err := attributevalue.Marshal(skPrefixes["page"] + p)
	if err != nil {
		return PageRecord{}, fmt.Errorf("%w | could not marshal value \"%s\" | %w", ErrDDBAttributeMarshal, s, err)
	}

	log.Printf("Querying table %s by PK: %+v, SK: %+v\n", ddbTable, pk, sk)

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
		return PageRecord{}, fmt.Errorf("%w | 0", ErrNoResults)
	}

	var pr PageRecord
	err = attributevalue.UnmarshalMap(r.Item, &pr)
	if err != nil {
		return PageRecord{}, fmt.Errorf("%w | could not marshal value item | %w", ErrDDBAttributeMarshal, err)
	}
	return pr, nil
}

func (db DB) PutPage(ctx context.Context, cr CreatePageRequest, isCreate bool) (UpdateResponse, error) {
	if isCreate {
		return db.CreatePage(ctx, cr)
	} else {
		return db.UpdatePage(ctx, cr)

	}
}

func (db DB) CreatePage(ctx context.Context, cr CreatePageRequest) (UpdateResponse, error) {

	ts := time.Now().Format(time.RFC3339)

	lr := cr.Links
	lra, err := attributevalue.MarshalList(cr.Links)
	if err != nil {
		return UpdateResponse{}, fmt.Errorf("%w | could not marshal list from link records | %w", ErrDDBAttributeMarshal, err)
	}

	pr := PageRecord{
		UserId:    cr.UserId,
		PageName:  cr.Page,
		Links:     lr,
		LinkAttr:  lra,
		UpdatedAt: ts,
		CreatedAt: ts,
	}

	r, err := svc.PutItem(ctx, &dynamodb.PutItemInput{
		ReturnValues: "ALL_OLD",
		TableName:    aws.String(ddbTable),
		Item: map[string]types.AttributeValue{
			"UserID": &types.AttributeValueMemberS{
				Value: pr.UserId,
			},
			"SK": &types.AttributeValueMemberS{
				Value: "PAGE#" + pr.PageName,
			},
			"Page": &types.AttributeValueMemberS{
				Value: "",
			},
			"PageName": &types.AttributeValueMemberS{
				Value: pr.PageName,
			},
			"Links": &types.AttributeValueMemberL{
				Value: pr.LinkAttr,
			},
			"CreatedAt": &types.AttributeValueMemberS{
				Value: pr.CreatedAt,
			},
			"UpdatedAt": &types.AttributeValueMemberS{
				Value: pr.UpdatedAt,
			},
		},
	})

	if err != nil {
		return UpdateResponse{}, fmt.Errorf("%w | error | %w", ErrDDBPutItem, err)
	}

	//prm, err := attributevalue.MarshalMap(pr)
	//if err != nil {
	//	return UpdateResponse{}, fmt.Errorf("%w | could not marshal map from page record | %w", ErrDDBAttributeMarshal, err)
	//}

	var par PageRecord
	err = attributevalue.UnmarshalMap(r.Attributes, &par)

	if err != nil {
		return UpdateResponse{}, fmt.Errorf("%w | error | %w", ErrDDBAttributeMarshal, err)
	}

	ur := UpdateResponse{
		Page: pr,
	}

	return ur, nil
}

func (db DB) UpdatePage(ctx context.Context, cr CreatePageRequest) (UpdateResponse, error) {

	ts := time.Now().Format(time.RFC3339)

	lr := cr.Links
	lra, err := attributevalue.MarshalList(cr.Links)
	if err != nil {
		return UpdateResponse{}, fmt.Errorf("%w | could not marshal list from link records | %w", ErrDDBAttributeMarshal, err)
	}

	pr := PageRecord{
		UserId:    cr.UserId,
		PageName:  cr.Page,
		Links:     lr,
		LinkAttr:  lra,
		UpdatedAt: ts,
	}

	r, err := svc.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		ReturnValues: "ALL_OLD",
		TableName:    aws.String(ddbTable),
		Key: map[string]types.AttributeValue{
			"UserID": &types.AttributeValueMemberS{
				Value: pr.UserId,
			},
			"SK": &types.AttributeValueMemberS{
				Value: "PAGE#" + pr.PageName,
			},
		},
		UpdateExpression: aws.String("SET Page = :Page, PageName = :PageName, Links = :Links, UpdatedAt = :UpdatedAt"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":Page": &types.AttributeValueMemberS{
				Value: "",
			},
			":PageName": &types.AttributeValueMemberS{
				Value: pr.PageName,
			},
			":Links": &types.AttributeValueMemberL{
				Value: pr.LinkAttr,
			},
			":UpdatedAt": &types.AttributeValueMemberS{
				Value: pr.UpdatedAt,
			},
		},
	})

	if err != nil {
		return UpdateResponse{}, fmt.Errorf("%w | error | %w", ErrDDBPutItem, err)
	}

	var pgr PageRecord
	err = attributevalue.UnmarshalMap(r.Attributes, &pgr)

	if err != nil {
		return UpdateResponse{}, fmt.Errorf("%w | error | %w", ErrDDBAttributeMarshal, err)
	}

	// take the createdAt value from table
	pr.CreatedAt = pgr.CreatedAt
	ur := UpdateResponse{
		Page:    pr,
		OldPage: pgr,
	}

	return ur, nil
}
