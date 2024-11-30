import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';

interface LambdaFunctionProps {
  architecture: lambda.Architecture;
  runtime: lambda.Runtime;
  id: string;
  handler: string;
  environment?: { [key: string]: string };
  logGroupProps?: logs.LogGroupProps;
  code: lambda.Code;
}

export class PrimeNumbersCounterStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const primeNumbersCounterLimitParam = new ssm.StringParameter(this, 'PrimeNumbersCounterLimit', {
      parameterName: 'PrimeNumbersCounterLimit',
      stringValue: '1000'
    });

    const createLambda = (props: LambdaFunctionProps) => {
      const logGroup = new logs.LogGroup(this, `LambdaLogGroup${props.id}`, {
        logGroupName: props.logGroupProps?.logGroupName,
        retention: props.logGroupProps?.retention
      });

      const lambdaFunction = new lambda.Function(this, props.id, {
        runtime: props.runtime,
        handler: props.handler,
        code: props.code,
        architecture: props.architecture,
        memorySize: 128,
        functionName: props.id,
        timeout: Duration.seconds(30),
        environment: props.environment,
        logGroup: logGroup
      });

      logGroup.grantWrite(lambdaFunction);

      return lambdaFunction;
    };

    const lambdaConfigs: LambdaFunctionProps[] = [
      {
        id: 'PrimeNumbersCounter-X86-Python',
        architecture: lambda.Architecture.X86_64,
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        environment: {"EXPERIMENT_TYPE": "X86_PYTHON"},
        logGroupProps: {
          logGroupName: `/aws/lambda/PrimeNumbersCounter-X86-Python`,
          retention: logs.RetentionDays.ONE_MONTH
        },
        code: lambda.Code.fromAsset(path.join(__dirname, '../../Python/package.zip')),
      },
      {
        id: 'PrimeNumbersCounter-Graviton-Python',
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        environment: {"EXPERIMENT_TYPE": "GRAVITON_PYTHON"},
        logGroupProps: {
          logGroupName: `/aws/lambda/PrimeNumbersCounter-Graviton-Python`,
          retention: logs.RetentionDays.ONE_MONTH
        },
        code: lambda.Code.fromAsset(path.join(__dirname, '../../Python/package.zip')),
      },
      {
        id: 'PrimeNumbersCounter-X86-CSharp',
        architecture: lambda.Architecture.X86_64,
        runtime: lambda.Runtime.DOTNET_8,
        handler: 'CSharp::CSharp.Functions::Handler',
        environment: {"EXPERIMENT_TYPE": "X86_CSHARP"},
        logGroupProps: {
          logGroupName: `/aws/lambda/PrimeNumbersCounter-X86-CSharp`,
          retention: logs.RetentionDays.ONE_MONTH
        },
        code: lambda.Code.fromAsset(path.join(__dirname, '../../CSharp/package_x86.zip')),
      },
      {
        id: 'PrimeNumbersCounter-Graviton-CSharp',
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.DOTNET_8,
        handler: 'CSharp::CSharp.Functions::Handler',
        environment: {"EXPERIMENT_TYPE": "GRAVITON_CSHARP"},
        logGroupProps: {
          logGroupName: `/aws/lambda/PrimeNumbersCounter-Graviton-CSharp`,
          retention: logs.RetentionDays.ONE_MONTH
        },
        code: lambda.Code.fromAsset(path.join(__dirname, '../../CSharp/package_arm.zip')),
      }
    ];

    for (const config of lambdaConfigs) {
      const lambdaFunction = createLambda(config);

      primeNumbersCounterLimitParam.grantRead(lambdaFunction);

      const rule = new events.Rule(this, `ScheduleRule${config.id}`, {
        schedule: events.Schedule.rate(Duration.minutes(1))
      });
      rule.addTarget(new targets.LambdaFunction(lambdaFunction));
    }
  }
}

// 1) Import the necessary AWS CDK libs
// 2) Define the LambdaFunctionProps interface
// 3) Define function createLambda that creates a Lambda function
// 4) Add Lambda functions configurations to the lambdaConfigs array
// 5) Iterate over the lambdaConfigs array and create Lambda functions