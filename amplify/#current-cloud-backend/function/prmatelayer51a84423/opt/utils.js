const detectGithubPulls = (text) => {
    const regex = /https:\/\/github.com\/aws-amplify\/amplify-cli\/pull\/(\d+)/g;
    return text.match(regex)
}

module.exports = {
    detectGithubPulls
}