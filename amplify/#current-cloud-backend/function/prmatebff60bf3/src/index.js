
const { App, AwsLambdaReceiver } = require('@slack/bolt');
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

app.event('reaction_added', async ({ event, client, logger}) => {
  try {
    const item = event['item'];
    const result = await client.conversations.history({
      token: SLACK_BOT_TOKEN,
      channel: item['channel'],
      inclusive: true,
      oldest: item['ts'],
      limit: 1
    });

    const text = result.messages[0].text;
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
          channel: item['channel'],
          attachments: attachments,
          blocks: blocks
        });
      
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
        logger.error(err);
      }
    }
  }
  catch(error) {
    logger.error(error);
  }
});

module.exports.handler = async (event, context, callback) => {
  try {
    const handler = await awsLambdaReceiver.start();
    return handler(event, context, callback);  
  }
  catch(e) {
    console.log(e)
  }
  
}