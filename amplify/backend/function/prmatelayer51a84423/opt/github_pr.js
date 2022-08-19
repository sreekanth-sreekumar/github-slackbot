const { createAttachments } = require('./attachments');
const { Octokit } = require('@octokit/rest')
const octokit = new Octokit({ auth: "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"})

class GithubPR {

    initialize = async (link) => {
        const linkParts = link.split('/');
        this.pull_number = linkParts[linkParts.length-1];
        this.repo = linkParts[linkParts.length-3];
        this.owner = linkParts[linkParts.length-4];

        try {
            let response = await octokit.request('GET /repos/:owner/:repo/pulls/:num', {
                owner: this.owner,
                repo: this.repo,
                num: this.pull_number
            });
            console.log('res: ', response)
            let result = response['data'];
            this.title = result['title'];
            this.user_login = result['user']['login'];
            this.user_avatar = result['user']['avatar_url'];
            this.labels = [];
            for (const label of result['labels']) {
                this.labels.push({'name': label['name'], 'color': label['color']});
            }
            this.updated_at = result["updated_at"];
            this.state = result['state'];

            this.reviewers = {};
            response = await octokit.request('GET /repos/:owner/:repo/pulls/:num/requested_reviewers', {
                owner: this.owner,
                repo: this.repo,
                num: this.pull_number
            });
            let results = response['data'];
            const reviewers = results['users'].concat(results['teams']);

            reviewers.forEach(result => {
                this.reviewers[result['login']] = {
                    'avatar': result['avatar_url'],
                    'state': "UNDER_REVIEW",
                    'submitted': null
                };
            });

            response = await octokit.request('GET /repos/:owner/:repo/pulls/:num/reviews', {
                owner: this.owner,
                repo: this.repo,
                num: this.pull_number
            });
            results = response['data'];
            results.forEach(result => {
                const login = result['user']['login'];
                if (login !== this.user_login) {
                    if (!(login in this.reviewers)) {
                        this.reviewers[login] = {
                            'avatar': result['user']['avatar_url'],
                            'state': result['state'],
                            'submitted': result['submitted_at']
                        }
                    }
                    else if (!this.reviewers[login]['submitted']) {
                        this.reviewers[login] = {
                            'avatar': result['user']['avatar_url'],
                            'state': result['state'],
                            'submitted': result['submitted_at']
                        };
                    }
                    else {
                        const curr_date = new Date(this.reviewers[login]['submitted']);
                        const inc_date = new Date(result['submitted_at']);
                        
                        if (inc_date > curr_date) {
                            this.reviewers[login] = {
                                'avatar': result['user']['avatar_url'],
                                'state': result['state'],
                                'submitted': result['submitted_at']
                            };
                        }
                    }
                }
            });

            let count = 0;
            Object.keys(this.reviewers).forEach(key => {
                if (this.reviewers[key]['state'] == 'APPROVED') {
                    count += 1;
                }
            });
            if (count >= 2) {
                this.color = "#00FF00";
            }
            else {
                this.color = '#FFA500';
            }
            if (this.state === 'closed') {
                this.color = '#6d00c1'
            }
        }
        catch(err) {
            console.log(err);
        }
    }

    createPrMessage = () => {
        const attachments = createAttachments(
            this.title, this.labels, this.user_avatar, this.user_login,
            this.updated_at, this.state, this.reviewers, this.color);
        const blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `A PR has been raised by <@${this.user_login}>`
                }
            }
        ];
        return { attachments, blocks };
    }
}

module.exports = {
    GithubPR
};