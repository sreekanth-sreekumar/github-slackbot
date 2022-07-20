

def get_reviewer_elements(reviewers):
    elements = []

    for key in reviewers.keys():
        elements.append({
            "type": "image",
            "image_url": reviewers[key]['avatar'],
            "alt_text": key
        })
    return elements

def get_reviewers(reviewers, status):
    line = ''
    for key in reviewers.keys():
        if reviewers[key]['state'] == status:
            line += key + ', '
    return line

def create_attachments(title, labels, user_avatar, user_login, updated_at, status, reviewers, color):

    pr_title = "*PR TITLE:* " + title
    pr_labels = "*Lables:* " + " ".join([label['name'] for label in labels])
    last_updated = "*Last Updated:* " + updated_at
    status = "*Status:* " + status

    reveiw_elements = get_reviewer_elements(reviewers)
    reveiw_elements.insert(0, {
        "type": "mrkdwn",
        "text": "*Reviewers: *"
    })

    approved_reviewers_text = "*Approved:* " + get_reviewers(reviewers, 'APPROVED')
    commented_reviewers_text = "*Commented:* " + get_reviewers(reviewers, 'COMMENTED')
    changes_requested_reviewers_text = "*Requested Changes:* " + get_reviewers(reviewers, 'CHANGES_REQUESTED')
    under_review_reviewers_text = "*Under Review:* " + get_reviewers(reviewers, 'UNDER_REVIEW')

    attachments = [{
        "color": color,
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": pr_title + "\n" + pr_labels
                },
                "accessory": {
                    "type": "image",
                    "image_url": user_avatar,
                    "alt_text": user_login
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": last_updated
                    },
                    {
                        "type": "mrkdwn",
                        "text": status
                    }
                ]
            },
            {
                "type": "context",
                "elements": reveiw_elements
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": approved_reviewers_text
                    },
                    {
                        "type": "mrkdwn",
                        "text": commented_reviewers_text
                    },
                    {
                        "type": "mrkdwn",
                        "text": changes_requested_reviewers_text
                    },
                    {
                        "type": "mrkdwn",
                        "text": under_review_reviewers_text
                    }
                ]
            }
        ]
    }]
    return attachments


# COMMENTED
# CHANGES_REQUESTED
# APPROVED