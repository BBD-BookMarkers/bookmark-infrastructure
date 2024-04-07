#!/bin/bash
sudo su -
sudo yum update -y
sudo curl -o /etc/yum.repos.d/msprod.repo https://packages.microsoft.com/config/rhel/9/prod.repo
sudo ACCEPT_EULA=Y yum install mssql-tools -y
sudo yum install jq -y

sudo yum install aspnetcore-runtime-8.0 -y
sudo yum install dotnet-sdk-8.0 -y
dotnet tool install --global x
. /etc/profile.d/dotnet-cli-tools-bin-path.sh
dotnet sdk check
echo "export PATH=$PATH:/usr/local/bin" >> ~/.bashrc
echo "export PATH=$PATH:/opt/mssql-tools/bin" >> ~/.bashrc
source ~/.bashrc

credentials=$(aws secretsmanager get-secret-value --secret-id bookmark-rds-credentials-dev --region eu-west-1 --query SecretString --output text)
username=$(echo $credentials | jq -r '.username')
password=$(echo $credentials | jq -r '.password')
host=$(echo $credentials | jq -r '.host')

database_exists() {
    local database_name="$1"
    local query="SELECT COUNT(*) FROM sys.databases WHERE name = '$database_name'"
    local result=$(sqlcmd -S "$host" -U "$username" -P "$password" -h -1 -Q "$query")
    [[ "$result" -gt 0 ]]
}

database_name="bookmarkerdb"

if database_exists "$database_name"; then
    echo "Database '$database_name' already exists."
else
    sqlcmd -S "$host" -U "$username" -P "$password" -Q "use master; CREATE DATABASE $database_name;"
    sqlcmd -S "$host" -U "$username" -P "$password" -Q "use $database_name;"
    echo "Database '$database_name' created."
fi

cd /home/ec2-user/
mkdir server

cat <<'SERVICE' | sudo tee /etc/systemd/system/server.service > /dev/null
[Unit]
Description=Server Service
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/home/ec2-user/server/
ExecStart=dotnet /home/ec2-user/server/Api.dll
ExecStop=
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload