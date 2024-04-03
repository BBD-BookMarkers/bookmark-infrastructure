#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BookmarkInfrastructureStack } from '../lib/bookmark-infrastructure-stack';

const app = new cdk.App();
new BookmarkInfrastructureStack(app, 'BookmarkInfrastructureStack-nonprod', {
  stackName: 'bookmarkers-nonprod',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  tags: {
    Project: 'Bookmarkers',
    DeployEnv: 'dev'
  },
  keyPairName: 'bookmark-ec2-key-pair', // add nonprod
  dbUsername: 'bookmark-db-dev',
  dbPort: 60221,
});