import requests
from attachments import create_attachments
from collections import defaultdict
from dateutil.parser import parse

class GithubPR:

    def initialize(self, link):
        link_parts = link.split('/')
        pull_number = link_parts[len(link_parts)-1]
        repo = link_parts[len(link_parts)-3]
        owner = link_parts[len(link_parts)-4]

        pr_request = 'https://api.github.com/repos/' + owner + '/' + repo + '/' + 'pulls/' + pull_number
        result = requests.get(pr_request).json()

        self.title = result['title']
        self.user_login = result['user']['login']
        self.user_avatar = result['user']['avatar_url']
        self.labels = []
        for label in result['labels']:
            self.labels.append({'name': label['name'], 'color': label['color']})
        
        self.updated_at = result["updated_at"]
        self.state = result['state']
            
        pr_request_reviewers = pr_request + '/requested_reviewers'
        pr_request_reviews = pr_request + '/reviews'
        
        results = requests.get(pr_request_reviewers).json()

        self.reviewers = defaultdict()
        for result in results['users'] + results['teams']:
            # self.reviewers.append({
            #     'login': result['login'],
            #     'avatar': result['avatar_url']
            # })
            self.reviewers[result['login']] = {
                'avatar': result['avatar_url'],
                'state': "UNDER_REVIEW",
                'submitted': None
            }

        results = requests.get(pr_request_reviews).json()
        for result in results:
            login = result['user']['login']
            if not self.reviewers[login]['submitted']:
                self.reviewers[login] = {
                    'avatar': result['user']['avatar_url'],
                    'state': result['state'],
                    'submitted': result['submitted_at']
                }
            else:
                curr_date = parse(self.reviewers[login]['submitted'])
                inc_date = parse(result['submitted_at'])

                if inc_date > curr_date:
                    self.reviewers[login] = {
                        'avatar': result['user']['avatar_url'],
                        'state': result['state'],
                        'submitted': result['submitted_at']
                    }
        
        count = 0
        for key in self.reviewers.keys():
            if self.reviewers[key]['state'] == 'APPROVED':
                count += 1
        if count >= 2:
            self.color = "#00FF00"
        else:
            self.color = '#FFA500'
            
    def create_pr_message(self):
        attachments = create_attachments(
            self.title, self.labels, self.user_avatar, self.user_login,
            self.updated_at, self.state, self.reviewers, self.color)
        blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "A PR has been raised"
                }
            }
	    ]
        return attachments, blocks


