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

variable "allowed_cidr" {
  type      = string
  sensitive = true
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
    cidr_blocks = [var.allowed_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
resource "aws_iam_role" "assert_role" {
  name = "assert-instance-role"
  assume_role_policy = jsonencode(
    {
      "Version" : "2012-10-17",
      "Statement" : [
        {
          "Effect" : "Allow",
          "Principal" : {
            "Service" : "ec2.amazonaws.com"
          },
          "Action" : "sts:AssumeRole"
        }
      ]
    }
  )
}

resource "aws_iam_role_policy_attachment" "cw_agent" {
  role       = aws_iam_role.assert_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_role_policy_attachment" "dynamo" {
  role       = aws_iam_role.assert_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess_v2"
}

resource "aws_iam_instance_profile" "assert_profile" {
  name = "assert-instance-profile"
  role = aws_iam_role.assert_role.name
}

resource "aws_instance" "assert" {
  # Amazon Linux 2023 kernel-6.12
  ami                    = "ami-0b1dcb5abc47cd8b5"
  instance_type          = "t3.micro"
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.assert_sg.id]
  key_name               = "assert-key"
  iam_instance_profile   = aws_iam_instance_profile.assert_profile.name
}


output "instance_public_ip" {
  value = aws_instance.assert.public_ip
}
