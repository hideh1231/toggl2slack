# toggl2slack

Send the day's recordings from toggl to the slack channel.  
togglで記録した1日の記録をslackのチャンネルに送信します．

If you want to change the recording timing, please modify the cron of "schedule" in the `serverless.yml`.  
記録のタイミングを変更したい場合，`serverlessyml`の"schedule"のcronを修正してください．

Prerequisites

- [serverless framework](https://github.com/serverless/serverless)
  - `npm install -g serverless`
- [aws-cli](https://github.com/aws/aws-cli)
  - `pip install aws-cli`

How to use

1. `git clone git@github.com:hideh1231/toggl2slack.git && cd toggl2slack`
2. `npm install`
3. `serverless config credentials --provider aws --key your-key --secret your-secret-token`
4. `aws ssm put-parameter --name toggl-api-token --value "your api token" --type SecureString`
    - detail: <https://github.com/toggl/toggl_api_docs>
5. `aws ssm put-parameter --name slack-url --value "slack incoming webhook" --type SecureString`
    - detail: <https://api.slack.com/messaging/webhooks>
6. `serverless deploy`
