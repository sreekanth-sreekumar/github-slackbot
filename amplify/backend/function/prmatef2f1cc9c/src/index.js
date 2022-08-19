/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	STORAGE_DYNAMO97666DC5_ARN
	STORAGE_DYNAMO97666DC5_NAME
	STORAGE_DYNAMO97666DC5_STREAMARN
Amplify Params - DO NOT EDIT */const { App, AwsLambdaReceiver } = require('@slack/bolt');
const { SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET } = require('/opt/constants');
const { detectGithubPulls } = require('/opt/utils');
const { GithubPR } = require("/opt/github_pr");
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const awsLambdaReceiver = new AwsLambdaReceiver({
    signingSecret: SLACK_SIGNING_SECRET
  });
  
const app = new App({
    token: SLACK_BOT_TOKEN,
    receiver: awsLambdaReceiver,
});

app.command('/prmate', async ({ack, client, command}) => {
    await ack(command['response_url']);
    const text = command['text'];
    const channel = command['channel_id'];
    const pr_urls = detectGithubPulls(text);
    for (const url of pr_urls) {
      const splits = url.split('/');
      const data_param = {
        TableName: process.env.STORAGE_DYNAMO97666DC5_NAME,
        Key: {
          link: url,
          pull_num: splits[splits.length - 1]
        }
      };
      try {
        const data = await dynamodb.get(data_param).promise();
        if (data.Item) {
          return;
        }
        const prObj = new GithubPR();
        await prObj.initialize(url);
        const { attachments, blocks } = prObj.createPrMessage();
        const res = await client.chat.postMessage({
          token: SLACK_BOT_TOKEN,
          channel: channel,
          attachments: attachments,
          blocks: blocks
        });
        console.log(res);
        
        const newParams = {
          TableName: process.env.STORAGE_DYNAMO97666DC5_NAME,
          Item: {
            link: url,
            org: prObj.owner,
            repository: prObj.repo,
            pull_num: prObj.pull_number,
            channel: res['channel'],
            message_ts: res['ts']
          }
        }
        await dynamodb.put(newParams).promise();
      }
      catch (err) {
        console.error(err);
      }
    }
    console.log(pr_urls)

})

module.exports.handler = async (event, context, callback) => {
    try {
      const handler = await awsLambdaReceiver.start();
      return handler(event, context, callback);  
    }
    catch(e) {
      console.log(e)
    }    
}