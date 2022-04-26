import { Stack, StackProps, SecretValue } from 'aws-cdk-lib'
import * as amplify from 'aws-cdk-lib/aws-amplify'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import * as codebuild from 'aws-cdk-lib/aws-codebuild'
import { Construct } from 'constructs'

export class AmplifyInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const secret = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      'ImportedSecret',
      'arn:aws:secretsmanager:ap-northeast-1:595625739628:secret:my-github-token-pTRlua',
    )

    const monorepo: amplify.CfnApp.EnvironmentVariableProperty = {
      name: 'AMPLIFY_MONOREPO_APP_ROOT',
      value: 'apps/frontend',
    }


    const env = props?.env || 'dev'
    const role = new iam.Role(this, 'amplify-role-webapp-' + env, {
      assumedBy: new iam.ServicePrincipal('amplify.amazonaws.com'),
      description: 'Custom role permitting resources creation from Amplify',
    })
    const amplifyFullAccessPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName(
      'AdministratorAccess-Amplify',
    )
    console.log('policy name: %o', amplifyFullAccessPolicy.toString())
    role.addManagedPolicy(amplifyFullAccessPolicy)
    console.dir(role.toString())
    console.log('roleArn: %o', role.roleArn)

    const amplifyApp = new amplify.CfnApp(this, 'test-mypage-cdk', {
      name: 'test-mypage-cdk',
			repository: 'https://github.com/kawasaki-teruo/monorepo5',
      oauthToken: secret.secretValueFromJson('my-github-token').toString(),
      environmentVariables: [monorepo],
      iamServiceRole: role.roleArn,
    })

    console.log(
      'oauth token: %o',
      secret.secretValueFromJson('my-github-token').toString(),
    )

    new amplify.CfnBranch(this, 'FrontendMain', {
      appId: amplifyApp.attrAppId,
      branchName: 'main', // you can put any branch here (careful, it will listen to changes on this branch)
      enableAutoBuild: true,
    })
  }
}