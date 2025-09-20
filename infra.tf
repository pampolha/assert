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

provider "aws" {
  region = "us-east-2"
}

resource "aws_dynamodb_table" "single_table" {
  name         = "assert-table"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "PK"
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

resource "aws_default_vpc" "default" {
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [aws_default_vpc.default.id]
  }
}

resource "aws_security_group" "assert_sg" {
  name        = "assert-sg"
  description = "Allow outbound traffic and inbound SSH"
  vpc_id      = aws_default_vpc.default.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
resource "aws_instance" "assert" {
  # Debian 13 (20250814-2204)
  ami                    = "ami-0bb7d855677353076"
  instance_type          = "t3.micro"
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.assert_sg.id]
  key_name               = "assert-key"
}

output "instance_public_ip" {
  value = aws_instance.assert.public_ip
}
