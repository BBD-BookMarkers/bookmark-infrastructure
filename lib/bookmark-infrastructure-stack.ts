import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import { readFileSync } from 'fs';

export interface ExtendedStackProps extends cdk.StackProps {
  readonly keyPairName: string,
  readonly dbUsername: string,
  readonly dbPort: number,
  readonly deployEnv: string,
}

const createVpc = (construct: Construct, depEnv: string): ec2.Vpc => {
  const vpc = new ec2.Vpc(construct, `bookmark-vpc-${depEnv}`, {
    ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/24'),
    natGateways: 1,
    subnetConfiguration: [
      {
        name: `bookmark-public-subnet-1-${depEnv}`,
        subnetType: ec2.SubnetType.PUBLIC,
        cidrMask: 28,
      },
      // {
      //   name: `bookmark-isolated-subnet-1-${depEnv}`,
      //   subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      //   cidrMask: 28,
      // }
    ]
  });
  return vpc;
}

const createEC2Instance = (scope: Construct, vpc: ec2.Vpc, keyPairName: string, depEnv: string): ec2.Instance => {
  const ec2SG = new ec2.SecurityGroup(scope, 'ec2-sec-group', {
    vpc: vpc,
    securityGroupName: `bookmark-ec2-security-group-${depEnv}`
  });

  ec2SG.addIngressRule(
    ec2.Peer.anyIpv4(),
    ec2.Port.tcp(22),
    'Allow SSH Connections.'
  );

  const keyPair = ec2.KeyPair.fromKeyPairName(scope, 'key-pair', keyPairName);

  const ec2IAMRole = new iam.Role(scope, 'ec2-role', {
    assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    roleName: `bookmark-ec2-role-${depEnv}`,
  });

  ec2IAMRole.addToPolicy(new iam.PolicyStatement({
    actions: ['secretsmanager:GetSecretValue', 'ssm:GetParameter'],
    resources: ['*'],
  }));

  const ec2Instance = new ec2.Instance(scope, 'ec2-instance', {
    instanceName: `bookmark-ec2-instance-${depEnv}`,
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
    role: ec2IAMRole,
  });

  const eip = new ec2.CfnEIP(scope, 'bookmark-eip');
  const eipAssoc = new ec2.CfnEIPAssociation(scope, 'bookmark-eip-assoc', {
    allocationId: eip.attrAllocationId,
    instanceId: ec2Instance.instanceId,
  });

  const userDataPath = depEnv === 'dev' ? './lib/user-data-nonprod.sh' : './lib/user-data-prod.sh';
  const userDataScript = readFileSync(userDataPath, 'utf8');
  ec2Instance.addUserData(userDataScript);

  return ec2Instance;
}

const createDBInstance = (scope: Construct, vpc: ec2.Vpc, dbUsername: string, depEnv: string, port: number): rds.DatabaseInstance => {
  const dbSG = new ec2.SecurityGroup(scope, 'db-sec-group', {
    vpc: vpc,
    securityGroupName: `bookmark-db-security-group-${depEnv}`
  });

  dbSG.addIngressRule(
    ec2.Peer.anyIpv4(),
    ec2.Port.tcp(port),
    'Allow MSSQL Connections.'
  );

  const dbInstance = new rds.DatabaseInstance(scope, `bookmark-db-${depEnv}`, {
    vpc: vpc,
    vpcSubnets: {
      subnetType: ec2.SubnetType.PUBLIC,
    },
    engine: rds.DatabaseInstanceEngine.sqlServerEx({
      version: rds.SqlServerEngineVersion.VER_16,
    }),
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.BURSTABLE3,
      ec2.InstanceSize.MICRO,
    ),
    credentials: rds.Credentials.fromGeneratedSecret(dbUsername, {
      secretName: `bookmark-rds-credentials-${depEnv}`
    }),
    multiAz: false,
    allocatedStorage: 20,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    securityGroups: [dbSG],
  });

  return dbInstance;
}

export class BookmarkInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ExtendedStackProps) {
    super(scope, id, props);

    const vpc = createVpc(this, props.deployEnv);
    const ec2Instance = createEC2Instance(this, vpc, props.keyPairName, props.deployEnv);
    const db = createDBInstance(this, vpc, props.dbUsername, props.deployEnv, props.dbPort);

    db.connections.allowFrom(ec2Instance, ec2.Port.tcp(props.dbPort));
  };
}
