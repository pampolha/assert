terraform {
  required_version = "~> 1.12.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.98.0"
    }
  }
  backend "s3" {
    bucket  = "assert-tf-state"
    key     = "state/terraform.tfstate"
    region  = "us-east-2"
    encrypt = true
  }
}

resource "aws_iam_role" "lambda_exec" {
  name = "lambda_exec_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess_v2"
}

resource "aws_lambda_function" "generator" {
  filename         = "assert-generator-payload.zip"
  function_name    = "assert-generator"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"                                                                                                         
  source_code_hash = filebase64sha256("assert-generator-payload.zip")
  runtime          = "nodejs22.x"
  timeout          = 60                                                                                                                     

  environment {
    variables = {
      OPENROUTER_API_KEY = var.openrouter_api_key
      AWS_ACCESS_KEY_ID = var.aws_access_key_id
      AWS_SECRET_ACCESS_KEY = var.aws_secret_access_key
      AWS_REGION = var.aws_region
    }
  }
}

resource "aws_iam_role" "scheduler_exec" {
  name = "scheduler_exec_role"
  assume_role_policy = jsonencode({
    Version: "2012-10-17",
    Statement: [
        {
            Effect: "Allow",
            Principal: {
                Service: "scheduler.amazonaws.com"
            },
            Action: "sts:AssumeRole"
        },
        {
            Action: [
                "lambda:InvokeFunction"
            ],
            Effect: "Allow",
            Resource: aws_lambda_function.generator.arn
        }
    ]
  })
}

resource "aws_scheduler_schedule" "generate_scenario" {
  name       = "generate-scenario-schedule"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = "rate(24 hours)"

  target {
    arn      = aws_lambda_function.generator.arn
    role_arn = aws_iam_role.scheduler_exec.arn

    input = jsonencode({
      FunctionName: aws_lambda_function.generator.arn,
      InvocationType: "event",
      Payload: jsonencode({
        action: "generateScenario"
      })
    })
  }
}

resource "aws_apigatewayv2_api" "http" {
  name          = "http_api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.generator.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "$default"                                                                                                                   
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.generator.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

resource "aws_dynamodb_table" "single_table" {
  name         = "assert-table"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "PK"
  range_key = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "GS1PK"
    type = "S"
  }

  attribute {
    name = "GS1SK"
    type = "S"
  }

  global_secondary_index {
    name            = "gs1"
    hash_key        = "GS1PK"
    range_key       = "GS1SK"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "expiryDate"
    enabled        = true
  }
}

variable "openrouter_api_key" {
  type        = string
  sensitive   = true                        
}

variable "aws_access_key_id" {
  type = string
  sensitive = true
}

variable "aws_secret_access_key" {
  type = string
  sensitive = true
}

variable "aws_region" {
  type = string
}

output "api_gateway_url" {
  description = "A URL de invocação do API Gateway."
  value       = aws_apigatewayv2_stage.default.invoke_url
}
