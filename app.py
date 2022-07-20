import os
from slack_bolt import App
import re
from github_pr import GithubPR
# from slack_bolt.adapter.aws_lambda import SlackRequestHandler

message_list = []

SLACK_BOT_TOKEN = "xoxb-3814038965219-3814219522050-2G7A5jVvMVkOpRKmozpRC5vS"
SLACK_SIGNIN_SECRET = "c0a000328d3f9863d884294e207095a9"

regex = r"(?i)\b((?:https?://|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'\".,<>?«»“”‘’]))"

app = App(
    token=SLACK_BOT_TOKEN,
    signing_secret=SLACK_SIGNIN_SECRET,
    process_before_response=True
)

@app.event("reaction_added")
def check_for_reaction(client, event, logger):
  if not (event['item']['channel'], event['item']['ts']) in message_list:
    if event["reaction"] == "strawberry":
      item = event["item"]
      message_list.append((item['channel'], item['ts']))
      result = client.conversations_history(
        channel=item['channel'],
        inclusive=True,
        oldest=item['ts'],
        limit=1
      )
      text = result['messages'][0]['text']
      urls = re.findall(regex, text)
      for url in urls[0]:
        if url:
          pr_object = GithubPR()
          pr_object.initialize(url)
          attachments, blocks = pr_object.create_pr_message()
          client.chat_postMessage(token=SLACK_BOT_TOKEN, channel=item['channel'], attachments=attachments, blocks=blocks)

if __name__ == "__main__":
    app.start(port=int(os.environ.get("PORT", 3000)))