# Bookmark Infrastructure
## Description
This CDK Stack provisions and deploys the relevant AWS resources required for the BBD-BookMarkers project.

This repository also includes the `SQL` used for initial database setup, as well as the relevant resources required for Liquibase.

`CI/CD` is implemented by means of GitHub actions that trigger on specific events (i.e. pull requests or pushes).

## AWS Resources Deployed
* `VPC`
    * Public and isolated `subnets`.
* `EC2`
    * `SecurityGroup`
        * Inbound ingress rule to allow `SSH` connections.
    * `KeyPair` association.
    * `IAM Role`
    * Custom `User Data` injected into the instance for startup configuration.
* `EIP`
    * Elastic IP with association to the `EC2` instance.
* `RDS`
    * MS SQL Server.
    * `SecurityGroup`
        * Inbound ingress rule to allow `MSSQL` traffic.
* `IDP` with GitHub to create a `Role` for GitHub actions to assume.

## How to use this repository:
Normally, `CI/CD` is taken care of through the process of making code changes and submitting a pull request in which validation checks will be run. Once approved, the merge will trigger deployment actions that implement the changes.

#### In the case that you want to deploy the CDK Stack manually:
To compare the local state of the stack to the remote stack state you can run:
```bash
npx cdk diff
```

To compile and verify changes to the stack locally you can run:
```bash
npx cdk synth
```

And finally, to deploy the stack to AWS you can run:
```bash
npx cdk deploy
```
**_NOTE:_** running CDK commands locally requires that you have AWS CDK CLI instaleld, and that you are authenticated with the appropriate account that you wish to deploy to.

## Link to documentation
Check out our [Confluence](https://crafdb.atlassian.net/wiki/spaces/BKMK/overview?homepageId=14975190)
