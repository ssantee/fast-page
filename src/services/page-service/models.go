package main

import "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"

type PageRecord struct {
	UserId    string                 `json:"userId"`
	PageName  string                 `json:"pageName" dynamodbav:"PageName"`
	Links     []LinkRecord           `json:"links" dynamodbav:"Links"`
	LinkAttr  []types.AttributeValue `json:"-" dynamodbav:"-"`
	CreatedAt string                 `json:"createdAt" dynamodbav:"CreatedAt"`
	UpdatedAt string                 `json:"updatedAt" dynamodbav:"UpdatedAt"`
}

type LinkRecord struct {
	Uri             string `json:"uri"`
	Title           string `json:"title"`
	AddedDate       string `json:"addedDate"`
	ModifiedDate    string `json:"modifiedDate"`
	PublishedStatus string `json:"publishedStatus"`
	Order           int    `json:"order"`
}

type CreatePageRequest struct {
	UserId     string       `json:"userId"`
	Page       string       `json:"page"`
	Links      []LinkRecord `json:"links"`
	TemplateId string       `json:"templateId"`
}

type ClientResponse struct {
	Message string `json:"message"`
	Data    string `json:"data,omitempty"`
}

type UpdateResponse struct {
	Page    PageRecord `json:"page" dynamodbav:"Page"`
	OldPage PageRecord `json:"oldPage" dynamodbav:"-"`
	SK      string     `json:"sk" dynamodbav:"SK"`
	UserId  string     `json:"userId" dynamodbav:"UserId"`
}
