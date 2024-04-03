import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';

export interface ExtendedStackProps extends cdk.StackProps {
  readonly keyPairName: string,
  readonly stackName: string,
  readonly dbUsername: string,
  readonly dbPort: number
}

const createVpc = (construct: Construct, stackName: string): ec2.Vpc => {
  const vpc = new ec2.Vpc(construct, `${stackName}-vpc`, {
    ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/24'),
    natGateways: 1,
    maxAzs: 1,
    subnetConfiguration: [
      {
        name: `${stackName}-public-subnet-1`,
        subnetType: ec2.SubnetType.PUBLIC,
        cidrMask: 28,
      },
      {
        name: `${stackName}-isolated-subnet-1`,
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        cidrMask: 28,
      }
    ]
  });
  return vpc;
}

const createEC2Instance = (scope: Construct, vpc: ec2.Vpc, keyPairName: string): ec2.Instance => {
  const ec2SG = new ec2.SecurityGroup(scope, 'ec2-sec-group', {
    vpc: vpc,
  });

  ec2SG.addIngressRule(
    ec2.Peer.anyIpv4(),
    ec2.Port.tcp(22),
    'Allow SSH Connections.'
  );

  const keyPair = ec2.KeyPair.fromKeyPairName(scope, 'key-pair', keyPairName);

  const ec2Instance = new ec2.Instance(scope, 'ec2-instance', {
    vpc: vpc,
    vpcSubnets: {
      subnetType: ec2.SubnetType.PUBLIC,
    },
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO),
    keyPair: keyPair,
    machineImage: new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
    }),
    securityGroup: ec2SG,
  });

  return ec2Instance;
}

const createDBInstance = (scope: Construct, vpc: ec2.Vpc, dbUsername: string): rds.DatabaseInstance => {
  const dbInstance = new rds.DatabaseInstance(scope, 'db-instance', {
    vpc: vpc,
    vpcSubnets: {
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    },
    engine: rds.DatabaseInstanceEngine.sqlServerEx({
      version: rds.SqlServerEngineVersion.VER_16,
    }),
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.BURSTABLE3,
      ec2.InstanceSize.MICRO,
    ),
    credentials: rds.Credentials.fromGeneratedSecret(dbUsername),
    multiAz: false,
    allocatedStorage: 20,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    databaseName: 'bookmark-db',
  });

  return dbInstance;
}

export class BookmarkInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ExtendedStackProps) {
    super(scope, id, props);

    const vpc = createVpc(this, props.stackName);
    const ec2Instance = createEC2Instance(this, vpc, props.keyPairName);
    const db = createDBInstance(this, vpc, props.dbUsername);

    db.connections.allowFrom(ec2Instance, ec2.Port.tcp(props.dbPort));
  };
}
