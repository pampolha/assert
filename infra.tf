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