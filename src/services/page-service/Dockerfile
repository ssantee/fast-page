FROM public.ecr.aws/docker/library/golang:1.20 as build-image
WORKDIR /src
COPY go.mod go.sum *.go ./
RUN GOARCH=arm64 GOOS=linux go build -tags lambda.norpc -o lambda-handler
FROM public.ecr.aws/lambda/provided:al2023
COPY --from=build-image /src/lambda-handler .
ENTRYPOINT ./lambda-handler
