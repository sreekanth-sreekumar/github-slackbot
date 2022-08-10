const getReviewerElements = (reviewers) => {
    let elements = [];

    Object.keys(reviewers).forEach(key => {
        elements.push({
            "type": "image",
            "image_url": reviewers[key]['avatar'],
            "alt_text": key
        });
    });
    return elements;
};

// async def get_reviewers(reviewers, status):
//     users = []
//     for key in reviewers.keys():
//         if reviewers[key]['state'] == status:
//             users = users + [key]
//     return ", ".join(await asyncio.gather(map_to_slack(user) f))


const static_map = {
    "sreekanth-sreekumar": "ssreekmr",
    "edwardfoyle": 	"foyleef",
    "jhockett": "johocke",
    "ammarkarachi": "ammkara"
};

const getReviewers = (reviewers, status) => {
    // let users = []
    // const request_url = "https://puzzleglue.open-source.a2z.com/github/inspect?user=";
    // Object.keys(reviewers).forEach(key => {
    //     if (reviewers[key]['state'] == status) {
    //         users = users.concat(key)
    //     }
    // })


    // const allPromise = await axios.all(users.map(user => axios.get(request_url + user)));
    // let slackUserNames = [] 
    // allPromise.forEach(value => slackUserNames.concat(`<@${value['username']}>`))
    // return ", ".join(slackUserNames)

    let users = [];
    Object.keys(reviewers).forEach(key => {
        if (reviewers[key]['state'] == status) {
            users = users.concat(`<@${static_map[key]}>`);
        }
    });
    return users.join(" ");
};

const createAttachments = (title, labels, user_avatar, user_login, updated_at, 
    status, reviewers, color) => {

    const pr_title = "*PR TITLE:* " + title;
    const pr_labels = "*Lables:* " + labels.map(label => label['name']).join(" ");
    const last_updated = "*Last Updated:* " + updated_at;
    const statusMessage = "*Status:* " + status;

    let reveiw_elements = getReviewerElements(reviewers);
    reveiw_elements.unshift({
        "type": "mrkdwn",
        "text": "*Reviewers: *"
    });

    const approved_reviewers_text = "*Approved:* " + getReviewers(reviewers, 'APPROVED');
    const commented_reviewers_text = "*Commented:* " + getReviewers(reviewers, 'COMMENTED');
    const changes_requested_reviewers_text = "*Requested Changes:* " + getReviewers(reviewers, 'CHANGES_REQUESTED');
    const under_review_reviewers_text = "*Under Review:* " + getReviewers(reviewers, 'UNDER_REVIEW');
    const markdown_text = [pr_title, pr_labels, last_updated, statusMessage].join("\n");

    const attachments = [{
        "color": color,
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": markdown_text
                },
                "accessory": {
                    "type": "image",
                    "image_url": user_avatar,
                    "alt_text": user_login
                }
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
    }];
    return attachments;
};

module.exports = {
    createAttachments
};