#!/bin/bash
source .env
set -e -x

deno check
deno lint
deno task build

TFVARS_PATH=.tfvars
PLAN_PATH=.terraform.plan
terraform init
terraform validate
terraform plan --var-file=$TFVARS_PATH --out=$PLAN_PATH
terraform apply --var-file=$TFVARS_PATH $PLAN_PATH

IP=$(terraform output --raw instance_public_ip)

BIN_TMP_REMOTE_PATH=/tmp/assert
CW_CONFIG_TMP_REMOTE_PATH=/tmp/config.json

echo "put ./bin/assert $BIN_TMP_REMOTE_PATH" | sftp -i $SSH_KEY $SSH_LOGIN@$IP
echo "put ./cw-agent-config.json $CW_CONFIG_TMP_REMOTE_PATH" | sftp -i $SSH_KEY $SSH_LOGIN@$IP

BIN_REMOTE_PATH=/usr/local/bin/assert
LOG_REMOTE_PATH=/var/log/assert.log

ssh -i $SSH_KEY $SSH_LOGIN@$IP "sudo mv $BIN_TMP_REMOTE_PATH $BIN_REMOTE_PATH && sudo chmod +x $BIN_REMOTE_PATH"
ssh -i $SSH_KEY $SSH_LOGIN@$IP "sudo touch $LOG_REMOTE_PATH && sudo chown $SSH_LOGIN:$SSH_LOGIN $LOG_REMOTE_PATH && sudo chmod 644 $LOG_REMOTE_PATH"

CW_CONFIG_REMOTE_PATH=/opt/aws/amazon-cloudwatch-agent/bin/config.json
CW_BIN_REMOTE_PATH=/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl
ssh -i $SSH_KEY $SSH_LOGIN@$IP "sudo yum install amazon-cloudwatch-agent -y"
ssh -i $SSH_KEY $SSH_LOGIN@$IP "sudo mv $CW_CONFIG_TMP_REMOTE_PATH $CW_CONFIG_REMOTE_PATH"
ssh -i $SSH_KEY $SSH_LOGIN@$IP "sudo $CW_BIN_REMOTE_PATH -a fetch-config -m ec2 -s -c file:$CW_CONFIG_REMOTE_PATH"

ssh -i $SSH_KEY $SSH_LOGIN@$IP "$BIN_REMOTE_PATH > $LOG_REMOTE_PATH 2>&1 &"