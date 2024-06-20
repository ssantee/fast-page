package main

type PageRecord struct {
	PageName  string       `json:"pageName" dynamodbav:"PageName"`
	Links     []LinkRecord `json:"links" dynamodbav:"Links"`
	CreatedAt string       `json:"createdAt" dynamodbav:"CreatedAt"`
	UpdatedAt string       `json:"updatedAt" dynamodbav:"UpdatedAt"`
}

type LinkRecord struct {
	Uri             string `json:"uri"`
	Title           string `json:"title"`
	AddedDate       string `json:"addedDate"`
	PublishedStatus string `json:"publishedStatus"`
}

type CreatePageRequest struct {
	UserId string `json:"userId"`
	Page   string `json:"page"`
}

type ClientResponse struct {
	Body string
}

type UpdateResponse struct {
	Page   PageRecord `json:"page" dynamodbav:"Page"`
	SK     string     `json:"sk" dynamodbav:"SK"`
	UserId string     `json:"userId" dynamodbav:"UserId"`
}
